// services/property.service.js
import Property from "../models/Property.js";
import { AppError } from "../utils/appError.utils.js";
import { propertyPopulate } from "../utils/helpers.utils.js";

export const createProperty = async (data) => {
  const property = await Property.create(data);
  await property.populate([
    { path: "ownerId", select: "firstName lastName email companyInfo" },
    { path: "assignedRealtorId", select: "firstName lastName email" },
  ]);
  return property;
};

export const getAllProperties = async (query) => {
  const {
    state,
    city,
    propertyType,
    status,
    minPrice,
    maxPrice,
    isApproved,
    isFeatured,
    page = 1,
    limit = 10,
  } = query;

  const filter = {};
  if (state) filter["location.state"] = new RegExp(state, "i");
  if (city) filter["location.city"] = new RegExp(city, "i");
  if (propertyType) filter["details.propertyType"] = propertyType;
  if (status) filter.status = status;
  if (isApproved !== undefined) filter.isApproved = isApproved === "true";
  if (isFeatured !== undefined) filter.isFeatured = isFeatured === "true";
  if (minPrice || maxPrice) {
    filter.priceInKobo = {};
    if (minPrice) filter.priceInKobo.$gte = parseInt(minPrice);
    if (maxPrice) filter.priceInKobo.$lte = parseInt(maxPrice);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const properties = await Property.find(filter)
    .populate("ownerId", "firstName lastName companyInfo")
    .populate("assignedRealtorId", "firstName lastName")
    .limit(parseInt(limit))
    .skip(skip)
    .sort({ createdAt: -1 });

  const total = await Property.countDocuments(filter);

  return { properties, total, page, pages: Math.ceil(total / parseInt(limit)) };
};

export const getPropertyById = async (id) => {
  const property = await Property.findById(id).populate(propertyPopulate);

  if (!property) throw new AppError("Property not found", 404);

  property.viewsCount += 1;
  await property.save();

  return property;
};

export const updateProperty = async (id, updates) => {
  const property = await Property.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  })
    .populate(propertyPopulate)
    .populate(propertyPopulate);
  if (!property) throw new AppError("Property not found", 404);
  return property;
};

export const deleteProperty = async (id) => {
  const property = await Property.findById(id);
  if (!property) throw new AppError("Property not found", 404);
  if (property.status === "reserved" || property.status === "sold")
    throw new AppError("Cannot delete reserved or sold property", 400);

  await Property.findByIdAndDelete(id);
  return true;
};

export const reserveProperty = async (id, buyerId) => {
  const property = await Property.findById(id);
  if (!property) throw new AppError("Property not found", 404);
  if (property.status !== "available")
    throw new AppError("Property is not available for reservation", 400);
  if (!property.isApproved)
    throw new AppError("Property is not approved yet", 400);

  await property.reserve(buyerId);
  await property.populate(propertyPopulate);
  return property;
};

export const markAsSold = async (id) => {
  const property = await Property.findById(id);
  if (!property) throw new AppError("Property not found", 404);

  await property.markAsSold();
  return property;
};

export const approveProperty = async (id, adminId) => {
  const property = await Property.findById(id);
  if (!property) throw new AppError("Property not found", 404);
  if (property.isApproved)
    throw new AppError("Property is already approved", 400);

  property.isApproved = true;
  property.approvedBy = adminId;
  property.approvedAt = new Date();
  await property.save();
  await property.populate("approvedBy", "firstName lastName");

  return property;
};

export const suspendProperty = async (id) => {
  const property = await Property.findByIdAndUpdate(
    id,
    { status: "suspended" },
    { new: true }
  );
  if (!property) throw new AppError("Property not found", 404);
  return property;
};

export const reactivateProperty = async (id) => {
  const property = await Property.findById(id);
  if (!property) throw new AppError("Property not found", 404);
  if (property.status !== "suspended")
    throw new AppError("Only suspended properties can be reactivated", 400);

  property.status = "available";
  await property.save();
  return property;
};

export const searchProperties = async ({ query, page = 1, limit = 10 }) => {
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const filter = {
    $or: [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
      { "location.city": { $regex: query, $options: "i" } },
      { "location.state": { $regex: query, $options: "i" } },
    ],
    isApproved: true,
    status: "available",
  };

  const properties = await Property.find(filter)
    .populate(propertyPopulate)
    .limit(parseInt(limit))
    .skip(skip)
    .sort({ createdAt: -1 });

  const total = await Property.countDocuments(filter);

  return { properties, total, page, pages: Math.ceil(total / parseInt(limit)) };
};

export const getFeaturedProperties = async (limit = 10) => {
  const properties = await Property.find({
    isFeatured: true,
    isApproved: true,
    status: "available",
  })
    .populate(propertyPopulate)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  return properties;
};

export const getPropertyStats = async () => {
  const totalProperties = await Property.countDocuments();
  const availableProperties = await Property.countDocuments({
    status: "available",
  });
  const reservedProperties = await Property.countDocuments({
    status: "reserved",
  });
  const soldProperties = await Property.countDocuments({ status: "sold" });
  const pendingApproval = await Property.countDocuments({ isApproved: false });

  const propertiesByType = await Property.aggregate([
    {
      $group: {
        _id: "$details.propertyType",
        count: { $sum: 1 },
        avgPrice: { $avg: "$priceInKobo" },
      },
    },
  ]);

  const propertiesByLocation = await Property.aggregate([
    {
      $group: {
        _id: { state: "$location.state", city: "$location.city" },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  const mostViewed = await Property.find({ isApproved: true })
    .sort({ viewsCount: -1 })
    .limit(5)
    .select("title viewsCount priceInKobo");

  return {
    totalProperties,
    availableProperties,
    reservedProperties,
    soldProperties,
    pendingApproval,
    propertiesByType,
    propertiesByLocation,
    mostViewed,
  };
};
