import express from "express";
import {
  createProperty,
  getAllProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  reserveProperty,
  markAsSold,
  approveProperty,
  suspendProperty,
  reactivateProperty,
  searchProperties,
  getFeaturedProperties,
  getPropertyStats,
} from "../controllers/propertyController.js";

import {
  createPropertyValidator,
  updatePropertyValidator,
  getPropertyByIdValidator,
  getAllPropertiesValidator,
  reservePropertyValidator,
  approvePropertyValidator,
  searchPropertiesValidator,
} from "../validators/propertyValidator.js";

const router = express.Router();

// ============================================
// PROPERTY ROUTES WITH VALIDATION MIDDLEWARE
// ============================================

/**
 * @route   POST /api/properties
 * @desc    Create a new property
 * @access  Private (Company/Admin)
 */
router.post("/", createPropertyValidator, createProperty);

/**
 * @route   GET /api/properties
 * @desc    Get all properties with optional filters
 * @query   state, city, propertyType, status, minPrice, maxPrice, isApproved, isFeatured, page, limit
 * @access  Public
 * @example /api/properties?state=Lagos&propertyType=apartment&minPrice=1000000&maxPrice=50000000&page=1&limit=10
 */
router.get("/", getAllPropertiesValidator, getAllProperties);

/**
 * @route   GET /api/properties/stats/summary
 * @desc    Get property statistics
 * @access  Private (Admin/Staff)
 */
router.get("/stats/summary", getPropertyStats);

/**
 * @route   GET /api/properties/featured
 * @desc    Get featured properties
 * @query   limit (default: 10)
 * @access  Public
 * @example /api/properties/featured?limit=5
 */
router.get("/featured", getFeaturedProperties);

/**
 * @route   GET /api/properties/search
 * @desc    Search properties by title/description/location
 * @query   query (required), page, limit
 * @access  Public
 * @example /api/properties/search?query=apartment+lagos&page=1&limit=10
 */
router.get("/search", searchPropertiesValidator, searchProperties);

/**
 * @route   GET /api/properties/:id
 * @desc    Get a single property by ID
 * @param   id - Property ID
 * @access  Public
 */
router.get("/:id", getPropertyByIdValidator, getPropertyById);

/**
 * @route   PUT /api/properties/:id
 * @desc    Update property information
 * @param   id - Property ID
 * @access  Private (Owner/Admin)
 */
router.put("/:id", updatePropertyValidator, updateProperty);

/**
 * @route   DELETE /api/properties/:id
 * @desc    Delete a property
 * @param   id - Property ID
 * @access  Private (Owner/Admin)
 * @warning Cannot delete reserved or sold properties
 */
router.delete("/:id", getPropertyByIdValidator, deleteProperty);

/**
 * @route   POST /api/properties/:id/reserve
 * @desc    Reserve a property for a buyer
 * @param   id - Property ID
 * @body    buyerId (required)
 * @access  Private (Buyer)
 * @example POST /api/properties/507f1f77bcf86cd799439011/reserve
 *          Body: { "buyerId": "507f1f77bcf86cd799439012" }
 */
router.post("/:id/reserve", reservePropertyValidator, reserveProperty);

/**
 * @route   PATCH /api/properties/:id/sold
 * @desc    Mark property as sold
 * @param   id - Property ID
 * @access  Private (Admin/Staff)
 */
router.patch("/:id/sold", getPropertyByIdValidator, markAsSold);

/**
 * @route   PATCH /api/properties/:id/approve
 * @desc    Approve property for public listing
 * @param   id - Property ID
 * @body    adminId (required)
 * @access  Private (Admin/Staff)
 * @example PATCH /api/properties/507f.../approve
 *          Body: { "adminId": "507f1f77bcf86cd799439015" }
 */
router.patch("/:id/approve", approvePropertyValidator, approveProperty);

/**
 * @route   PATCH /api/properties/:id/suspend
 * @desc    Suspend property listing
 * @param   id - Property ID
 * @access  Private (Owner/Admin)
 */
router.patch("/:id/suspend", getPropertyByIdValidator, suspendProperty);

/**
 * @route   PATCH /api/properties/:id/reactivate
 * @desc    Reactivate suspended property
 * @param   id - Property ID
 * @access  Private (Owner/Admin)
 */
router.patch("/:id/reactivate", getPropertyByIdValidator, reactivateProperty);

export default router;
