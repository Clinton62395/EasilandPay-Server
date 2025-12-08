// controllers/property.controller.js
import * as propertyService from "../services/property.service.js";
import { catchAsynch } from "../utils/catchAsynch.utils.js";
import { AppError } from "../utils/appError.utils.js";

// ============================================
// CREATE PROPERTY
// ============================================
export const createProperty = catchAsynch(async (req, res, next) => {
  const property = await propertyService.createProperty(req.body);
  res.status(201).json({
    success: true,
    message: "Property created successfully",
    data: property,
  });
});

// ============================================
// GET ALL PROPERTIES
// ============================================
export const getAllProperties = catchAsynch(async (req, res, next) => {
  const result = await propertyService.getAllProperties(req.query);
  res.status(200).json({
    success: true,
    count: result.properties.length,
    total: result.total,
    page: result.page,
    pages: result.pages,
    data: result.properties,
  });
});

// ============================================
// GET PROPERTY BY ID
// ============================================
export const getPropertyById = catchAsynch(async (req, res, next) => {
  const property = await propertyService.getPropertyById(req.params.id);
  res.status(200).json({
    success: true,
    data: property,
  });
});

// ============================================
// UPDATE PROPERTY
// ============================================
export const updateProperty = catchAsynch(async (req, res, next) => {
  const property = await propertyService.updateProperty(
    req.params.id,
    req.body
  );
  res.status(200).json({
    success: true,
    message: "Property updated successfully",
    data: property,
  });
});

// ============================================
// DELETE PROPERTY
// ============================================
export const deleteProperty = catchAsynch(async (req, res, next) => {
  await propertyService.deleteProperty(req.params.id);
  res.status(200).json({
    success: true,
    message: "Property deleted successfully",
  });
});

// ============================================
// RESERVE PROPERTY
// ============================================
export const reserveProperty = catchAsynch(async (req, res, next) => {
  const property = await propertyService.reserveProperty(
    req.params.id,
    req.body.buyerId
  );
  res.status(200).json({
    success: true,
    message: "Property reserved successfully",
    data: property,
  });
});

// ============================================
// MARK AS SOLD
// ============================================
export const markAsSold = catchAsynch(async (req, res, next) => {
  const property = await propertyService.markAsSold(req.params.id);
  res.status(200).json({
    success: true,
    message: "Property marked as sold",
    data: property,
  });
});

// ============================================
// APPROVE PROPERTY
// ============================================
export const approveProperty = catchAsynch(async (req, res, next) => {
  const property = await propertyService.approveProperty(
    req.params.id,
    req.body.adminId
  );
  res.status(200).json({
    success: true,
    message: "Property approved successfully",
    data: property,
  });
});

// ============================================
// SUSPEND PROPERTY
// ============================================
export const suspendProperty = catchAsynch(async (req, res, next) => {
  const property = await propertyService.suspendProperty(req.params.id);
  res.status(200).json({
    success: true,
    message: "Property suspended successfully",
    data: property,
  });
});

// ============================================
// REACTIVATE PROPERTY
// ============================================
export const reactivateProperty = catchAsynch(async (req, res, next) => {
  const property = await propertyService.reactivateProperty(req.params.id);
  res.status(200).json({
    success: true,
    message: "Property reactivated successfully",
    data: property,
  });
});

// ============================================
// SEARCH PROPERTIES
// ============================================
export const searchProperties = catchAsynch(async (req, res, next) => {
  const result = await propertyService.searchProperties(req.query);
  res.status(200).json({
    success: true,
    count: result.properties.length,
    total: result.total,
    page: result.page,
    pages: result.pages,
    data: result.properties,
  });
});

// ============================================
// GET FEATURED PROPERTIES
// ============================================
export const getFeaturedProperties = catchAsynch(async (req, res, next) => {
  const limit = req.query.limit || 10;
  const properties = await propertyService.getFeaturedProperties(limit);
  res.status(200).json({
    success: true,
    count: properties.length,
    data: properties,
  });
});

// ============================================
// GET PROPERTY STATISTICS
// ============================================
export const getPropertyStats = catchAsynch(async (req, res, next) => {
  const stats = await propertyService.getPropertyStats();
  res.status(200).json({
    success: true,
    data: stats,
  });
});
