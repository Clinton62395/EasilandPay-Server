import express from "express";
import * as PropertyController from "../controllers/property.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import upload from "../middlewares/upload.middleware.js";

const router = express.Router();

// ============================================
// PUBLIC ROUTES
// ============================================

/**
 * @swagger
 * /property:
 *   get:
 *     summary: Get all properties with filters
 *     description: Retrieve properties with optional filtering, sorting and pagination
 *     tags: [Properties]
 *     parameters:
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: Filter by state
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *       - in: query
 *         name: propertyType
 *         schema:
 *           type: string
 *           enum: [HOUSE, APARTMENT, LAND, COMMERCIAL, VILLA, DUPLEX, BUNGALOW]
 *         description: Filter by property type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [available, reserved, sold, suspended]
 *         description: Filter by status
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: integer
 *         description: Minimum price in kobo
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: integer
 *         description: Maximum price in kobo
 *       - in: query
 *         name: isFeatured
 *         schema:
 *           type: boolean
 *         description: Filter featured properties
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of properties
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     properties:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Property'
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     pages:
 *                       type: integer
 */
router.get("/", PropertyController.getAllProperties);

/**
 * @swagger
 * /property/featured:
 *   get:
 *     summary: Get featured properties
 *     description: Retrieve featured properties that are approved and available
 *     tags: [Properties]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of featured properties to return
 *     responses:
 *       200:
 *         description: List of featured properties
 */
router.get("/featured", PropertyController.getFeaturedProperties);

/**
 * @swagger
 * /property/search:
 *   get:
 *     summary: Search properties
 *     description: Search properties by title, description, city or state
 *     tags: [Properties]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Search results
 */
router.get("/search", PropertyController.searchProperties);

/**
 * @swagger
 * /property/{id}:
 *   get:
 *     summary: Get property by ID
 *     description: Retrieve a single property by ID and increment view count
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *     responses:
 *       200:
 *         description: Property details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     property:
 *                       $ref: '#/components/schemas/Property'
 *       404:
 *         description: Property not found
 */
router.get("/:id", PropertyController.getPropertyById);

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

/**
 * @swagger
 * /property:
 *   post:
 *     summary: Create a new property
 *     description: Create a new property listing (requires authentication)
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - priceInKobo
 *               - location
 *               - details
 *             properties:
 *               title:
 *                 type: string
 *                 example: Luxury Villa in Banana Island
 *               description:
 *                 type: string
 *               priceInKobo:
 *                 type: integer
 *                 example: 5000000000
 *               location:
 *                 type: object
 *                 properties:
 *                   address:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   country:
 *                     type: string
 *                     default: Nigeria
 *                   coordinates:
 *                     type: object
 *                     properties:
 *                       lat:
 *                         type: number
 *                       lng:
 *                         type: number
 *               details:
 *                 type: object
 *                 properties:
 *                   propertyType:
 *                     type: string
 *                     enum: [HOUSE, APARTMENT, LAND, COMMERCIAL, VILLA, DUPLEX, BUNGALOW]
 *                   bedrooms:
 *                     type: integer
 *                   bathrooms:
 *                     type: integer
 *                   area:
 *                     type: number
 *                     description: Area in square meters
 *                   yearBuilt:
 *                     type: integer
 *                   features:
 *                     type: array
 *                     items:
 *                       type: string
 *               isFeatured:
 *                 type: boolean
 *                 default: false
 *               assignedRealtorId:
 *                 type: string
 *                 description: ID of assigned realtor
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Property created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/",
  authenticate,
  authorize("admin", "seller", "realtor"),
  upload.array("images", 10),
  PropertyController.createProperty
);

/**
 * @swagger
 * /property/{id}:
 *   put:
 *     summary: Update property
 *     description: Update property details (owner, admin or assigned realtor only)
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PropertyUpdate'
 *     responses:
 *       200:
 *         description: Property updated successfully
 *       403:
 *         description: Not authorized to update this property
 *       404:
 *         description: Property not found
 */
router.put(
  "/:id",
  authenticate,
  authorize("admin", "seller", "realtor"),
  PropertyController.updateProperty
);

/**
 * @swagger
 * /property/{id}:
 *   delete:
 *     summary: Delete property
 *     description: Delete a property (cannot delete reserved or sold properties)
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Property deleted successfully
 *       400:
 *         description: Cannot delete reserved or sold property
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Property not found
 */
router.delete(
  "/:id",
  authenticate,
  authorize("admin", "seller"),
  PropertyController.deleteProperty
);

/**
 * @swagger
 * /property/{id}/reserve:
 *   put:
 *     summary: Reserve property
 *     description: Reserve a property for purchase (buyer only)
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               buyerId:
 *                 type: string
 *                 description: ID of the buyer
 *     responses:
 *       200:
 *         description: Property reserved successfully
 *       400:
 *         description: Property not available or not approved
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Property not found
 */
router.put(
  "/:id/reserve",
  authenticate,
  authorize("admin", "buyer"),
  PropertyController.reserveProperty
);

/**
 * @swagger
 * /property/{id}/sold:
 *   put:
 *     summary: Mark property as sold
 *     description: Mark a reserved property as sold (owner or admin only)
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Property marked as sold
 *       400:
 *         description: Property not in reserved state
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Property not found
 */
router.put(
  "/:id/sold",
  authenticate,
  authorize("admin", "seller"),
  PropertyController.markAsSold
);

// ============================================
// ADMIN ROUTES
// ============================================

/**
 * @swagger
 * /property/{id}/approve:
 *   put:
 *     summary: Approve property (Admin)
 *     description: Approve a property for listing (admin only)
 *     tags: [Properties - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Property approved successfully
 *       400:
 *         description: Property already approved
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Admin only
 *       404:
 *         description: Property not found
 */
router.put(
  "/:id/approve",
  authenticate,
  authorize("admin"),
  PropertyController.approveProperty
);

/**
 * @swagger
 * /property/{id}/suspend:
 *   put:
 *     summary: Suspend property (Admin)
 *     description: Suspend a property listing (admin only)
 *     tags: [Properties - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Property suspended successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Admin only
 *       404:
 *         description: Property not found
 */
router.put(
  "/:id/suspend",
  authenticate,
  authorize("admin"),
  PropertyController.suspendProperty
);

/**
 * @swagger
 * /property/{id}/reactivate:
 *   put:
 *     summary: Reactivate property (Admin)
 *     description: Reactivate a suspended property (admin only)
 *     tags: [Properties - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Property reactivated successfully
 *       400:
 *         description: Only suspended properties can be reactivated
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Admin only
 *       404:
 *         description: Property not found
 */
router.put(
  "/:id/reactivate",
  authenticate,
  authorize("admin"),
  PropertyController.reactivateProperty
);

/**
 * @swagger
 * /property/admin/stats:
 *   get:
 *     summary: Get property statistics (Admin)
 *     description: Get comprehensive statistics about properties (admin only)
 *     tags: [Properties - Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalProperties:
 *                       type: integer
 *                     availableProperties:
 *                       type: integer
 *                     reservedProperties:
 *                       type: integer
 *                     soldProperties:
 *                       type: integer
 *                     pendingApproval:
 *                       type: integer
 *                     propertiesByType:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: integer
 *                           avgPrice:
 *                             type: number
 *                     propertiesByLocation:
 *                       type: array
 *                     mostViewed:
 *                       type: array
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Admin only
 */
router.get(
  "/admin/stats",
  authenticate,
  authorize("admin"),
  PropertyController.getPropertyStats
);

export default router;
