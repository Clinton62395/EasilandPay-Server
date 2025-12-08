import { body, param, query, validationResult } from "express-validator";
import User from "../models/User.js";

// ============================================
// MIDDLEWARE: Handle Validation Errors
// ============================================
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
        value: err.value,
      })),
    });
  }

  next();
};

// ============================================
// VALIDATOR: Create Property
// ============================================
export const createPropertyValidator = [
  // Title validation
  body("title")
    .notEmpty()
    .withMessage("Property title is required")
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage("Title must be between 10 and 200 characters"),

  // Description validation
  body("description")
    .notEmpty()
    .withMessage("Description is required")
    .trim()
    .isLength({ min: 50, max: 2000 })
    .withMessage("Description must be between 50 and 2000 characters"),

  // Price validation
  body("priceInKobo")
    .notEmpty()
    .withMessage("Price is required")
    .isInt({ min: 100000 })
    .withMessage("Price must be at least 1000 NGN (100000 kobo)"),

  // Location validation
  body("location.state")
    .notEmpty()
    .withMessage("State is required")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("State must be between 2 and 50 characters"),

  body("location.city")
    .notEmpty()
    .withMessage("City is required")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("City must be between 2 and 50 characters"),

  body("location.address")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Address cannot exceed 200 characters"),

  body("location.coordinates.latitude")
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage("Latitude must be between -90 and 90"),

  body("location.coordinates.longitude")
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage("Longitude must be between -180 and 180"),

  // Details validation
  body("details.bedrooms")
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage("Bedrooms must be between 0 and 50"),

  body("details.bathrooms")
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage("Bathrooms must be between 0 and 50"),

  body("details.sizeInSqm")
    .optional()
    .isFloat({ min: 1 })
    .withMessage("Size must be at least 1 square meter"),

  body("details.propertyType")
    .notEmpty()
    .withMessage("Property type is required")
    .isIn(["apartment", "house", "land", "commercial", "duplex", "villa"])
    .withMessage("Invalid property type"),

  // Payment plans validation
  body("availablePaymentPlans")
    .optional()
    .isArray()
    .withMessage("Available payment plans must be an array")
    .custom((value) => {
      const validPlans = [
        "weekly",
        "monthly",
        "quarterly",
        "bi-annual",
        "yearly",
        "outright",
      ];
      const invalidPlans = value.filter((plan) => !validPlans.includes(plan));
      if (invalidPlans.length > 0) {
        throw new Error(`Invalid payment plans: ${invalidPlans.join(", ")}`);
      }
      return true;
    }),

  // Owner ID validation
  body("ownerId")
    .notEmpty()
    .withMessage("Owner ID is required")
    .isMongoId()
    .withMessage("Invalid owner ID format")
    .custom(async (value) => {
      const owner = await User.findById(value);
      if (!owner) {
        throw new Error("Owner not found");
      }
      if (owner.role !== "company" && owner.role !== "admin") {
        throw new Error("Only company or admin can own properties");
      }
      return true;
    }),

  // Realtor ID validation (optional)
  body("assignedRealtorId")
    .optional()
    .isMongoId()
    .withMessage("Invalid realtor ID format")
    .custom(async (value) => {
      if (value) {
        const realtor = await User.findById(value);
        if (!realtor) {
          throw new Error("Realtor not found");
        }
        if (realtor.role !== "realtor") {
          throw new Error("Assigned user must be a realtor");
        }
      }
      return true;
    }),

  handleValidationErrors,
];

// ============================================
// VALIDATOR: Update Property
// ============================================
export const updatePropertyValidator = [
  param("id")
    .notEmpty()
    .withMessage("Property ID is required")
    .isMongoId()
    .withMessage("Invalid property ID format"),

  // All fields optional for update
  body("title")
    .optional()
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage("Title must be between 10 and 200 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ min: 50, max: 2000 })
    .withMessage("Description must be between 50 and 2000 characters"),

  body("priceInKobo")
    .optional()
    .isInt({ min: 100000 })
    .withMessage("Price must be at least 1000 NGN (100000 kobo)"),

  body("status")
    .optional()
    .isIn(["available", "reserved", "sold", "suspended"])
    .withMessage("Invalid status"),

  handleValidationErrors,
];

// ============================================
// VALIDATOR: Get Property By ID
// ============================================
export const getPropertyByIdValidator = [
  param("id")
    .notEmpty()
    .withMessage("Property ID is required")
    .isMongoId()
    .withMessage("Invalid property ID format"),

  handleValidationErrors,
];

// ============================================
// VALIDATOR: Get All Properties
// ============================================
export const getAllPropertiesValidator = [
  query("state")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("State must be at least 2 characters"),

  query("city")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("City must be at least 2 characters"),

  query("propertyType")
    .optional()
    .isIn(["apartment", "house", "land", "commercial", "duplex", "villa"])
    .withMessage("Invalid property type"),

  query("status")
    .optional()
    .isIn(["available", "reserved", "sold", "suspended"])
    .withMessage("Invalid status"),

  query("minPrice")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Min price must be a non-negative integer (in kobo)"),

  query("maxPrice")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Max price must be a non-negative integer (in kobo)"),

  query("isApproved")
    .optional()
    .isBoolean()
    .withMessage("isApproved must be true or false"),

  query("isFeatured")
    .optional()
    .isBoolean()
    .withMessage("isFeatured must be true or false"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  handleValidationErrors,
];

// ============================================
// VALIDATOR: Reserve Property
// ============================================
export const reservePropertyValidator = [
  param("id")
    .notEmpty()
    .withMessage("Property ID is required")
    .isMongoId()
    .withMessage("Invalid property ID format"),

  body("buyerId")
    .notEmpty()
    .withMessage("Buyer ID is required")
    .isMongoId()
    .withMessage("Invalid buyer ID format")
    .custom(async (value) => {
      const buyer = await User.findById(value);
      if (!buyer) {
        throw new Error("Buyer not found");
      }
      if (buyer.role !== "buyer") {
        throw new Error("User must be a buyer");
      }
      return true;
    }),

  handleValidationErrors,
];

// ============================================
// VALIDATOR: Approve Property
// ============================================
export const approvePropertyValidator = [
  param("id")
    .notEmpty()
    .withMessage("Property ID is required")
    .isMongoId()
    .withMessage("Invalid property ID format"),

  body("adminId")
    .notEmpty()
    .withMessage("Admin ID is required")
    .isMongoId()
    .withMessage("Invalid admin ID format")
    .custom(async (value) => {
      const admin = await User.findById(value);
      if (!admin) {
        throw new Error("Admin not found");
      }
      if (admin.role !== "admin" && admin.role !== "staff") {
        throw new Error("Only admin or staff can approve properties");
      }
      return true;
    }),

  handleValidationErrors,
];

// ============================================
// VALIDATOR: Search Properties
// ============================================
export const searchPropertiesValidator = [
  query("query")
    .notEmpty()
    .withMessage("Search query is required")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Search query must be between 2 and 100 characters"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  handleValidationErrors,
];
