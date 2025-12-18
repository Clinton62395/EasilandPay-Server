import express from "express";
import * as PlanController from "../controllers/plan.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ============================================
// PUBLIC ROUTES
// ============================================

/**
 * @swagger
 * /plan:
 *   get:
 *     summary: Get all plans with filters
 *     description: Retrieve a list of plans with optional filtering and pagination
 *     tags: [Plans]
 *     parameters:
 *       - in: query
 *         name: planType
 *         schema:
 *           type: string
 *           enum: [installment, savings, mortgage, investment, rental]
 *         description: Filter by plan type
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *       - in: query
 *         name: isPublic
 *         schema:
 *           type: boolean
 *         description: Filter by public visibility
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
 *         description: List of plans
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   description: Number of plans in current page
 *                 total:
 *                   type: integer
 *                   description: Total number of plans
 *                 page:
 *                   type: integer
 *                 pages:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Plan'
 */
router.get("/", PlanController.getAllPlans);

/**
 * @swagger
 * /plan/active:
 *   get:
 *     summary: Get all active plans
 *     description: Retrieve a list of all active plans (public and private)
 *     tags: [Plans]
 *     responses:
 *       200:
 *         description: List of active plans
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Plan'
 */
router.get("/active", PlanController.getActivePlans);

/**
 * @swagger
 * /plan/type/{planType}:
 *   get:
 *     summary: Get plans by type
 *     description: Retrieve plans by their type (e.g., installment, savings, mortgage, etc.)
 *     tags: [Plans]
 *     parameters:
 *       - in: path
 *         name: planType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [installment, savings, mortgage, investment, rental]
 *         description: Plan type
 *     responses:
 *       200:
 *         description: List of plans by type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Plan'
 *       400:
 *         description: Invalid plan type
 */
router.get("/type/:planType", PlanController.getPlansByType);

/**
 * @swagger
 * /plan/{id}:
 *   get:
 *     summary: Get plan by ID
 *     description: Retrieve a specific plan by its ID
 *     tags: [Plans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Plan ID
 *     responses:
 *       200:
 *         description: Plan details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Plan'
 *       404:
 *         description: Plan not found
 */
router.get("/:id", PlanController.getPlanById);

/**
 * @swagger
 * /plan/calculate/{id}:
 *   post:
 *     summary: Calculate plan installments
 *     description: Calculate the installment details for a given plan and amount
 *     tags: [Plans]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Plan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: integer
 *                 description: Amount in kobo to calculate installments for
 *                 example: 1000000
 *     responses:
 *       200:
 *         description: Calculation successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     plan:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         duration:
 *                           type: string
 *                         durationInMonths:
 *                           type: integer
 *                         interestRate:
 *                           type: number
 *                         numberOfInstallments:
 *                           type: integer
 *                         installmentFrequency:
 *                           type: string
 *                     calculation:
 *                       type: object
 *       400:
 *         description: Invalid amount or plan not active
 *       404:
 *         description: Plan not found
 */
router.post("/calculate/:id", PlanController.calculatePlan);

/**
 * @swagger
 * /plan/find:
 *   get:
 *     summary: Find plans for a given amount
 *     description: Find plans that are suitable for a given amount. Optionally filter by plan type.
 *     tags: [Plans]
 *     parameters:
 *       - in: query
 *         name: amount
 *         required: true
 *         schema:
 *           type: integer
 *         description: Amount in kobo
 *         example: 5000000
 *       - in: query
 *         name: planType
 *         schema:
 *           type: string
 *           enum: [installment, savings, mortgage, investment, rental]
 *         description: Filter by plan type (optional)
 *     responses:
 *       200:
 *         description: List of suitable plans
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                 amount:
 *                   type: number
 *                   description: Amount in Naira
 *                 amountInKobo:
 *                   type: integer
 *                   description: Amount in kobo
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Plan'
 *       400:
 *         description: Invalid amount or plan type
 */
router.get("/find", PlanController.findPlansForAmount);

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

/**
 * @swagger
 * /plan:
 *   post:
 *     summary: Create a new plan
 *     description: Create a new plan (admin/staff only)
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PlanCreate'
 *     responses:
 *       201:
 *         description: Plan created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Plan created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Plan'
 *       400:
 *         description: Invalid input data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Admin/Staff only
 */
router.post(
  "/",
  authenticate,
  authorize("admin", "staff"),
  PlanController.createPlan
);

/**
 * @swagger
 * /plan/{id}:
 *   put:
 *     summary: Update a plan
 *     description: Update an existing plan (admin/staff only)
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Plan ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PlanUpdate'
 *     responses:
 *       200:
 *         description: Plan updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Plan updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Plan'
 *       400:
 *         description: Invalid input data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Admin/Staff only
 *       404:
 *         description: Plan not found
 */
router.put(
  "/:id",
  authenticate,
  authorize("admin", "staff"),
  PlanController.updatePlan
);

/**
 * @swagger
 * /plan/{id}:
 *   delete:
 *     summary: Delete a plan
 *     description: Delete a plan (admin/staff only). A plan with active subscriptions cannot be deleted.
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Plan ID
 *     responses:
 *       200:
 *         description: Plan deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Plan deleted successfully
 *       400:
 *         description: Cannot delete plan with active subscriptions
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Admin/Staff only
 *       404:
 *         description: Plan not found
 */
router.delete(
  "/:id",
  authenticate,
  authorize("admin", "staff"),
  PlanController.deletePlan
);

/**
 * @swagger
 * /plan/{id}/deactivate:
 *   put:
 *     summary: Deactivate a plan
 *     description: Deactivate a plan (admin/staff only)
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Plan ID
 *     responses:
 *       200:
 *         description: Plan deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Plan deactivated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Plan'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Admin/Staff only
 *       404:
 *         description: Plan not found
 */
router.put(
  "/:id/deactivate",
  authenticate,
  authorize("admin", "staff"),
  PlanController.deactivatePlan
);

/**
 * @swagger
 * /plan/{id}/activate:
 *   put:
 *     summary: Activate a plan
 *     description: Activate a plan (admin/staff only)
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Plan ID
 *     responses:
 *       200:
 *         description: Plan activated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Plan activated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Plan'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Admin/Staff only
 *       404:
 *         description: Plan not found
 */
router.put(
  "/:id/activate",
  authenticate,
  authorize("admin", "staff"),
  PlanController.activatePlan
);

// ============================================
// ADMIN ROUTES
// ============================================

/**
 * @swagger
 * /plan/admin/stats:
 *   get:
 *     summary: Get plan statistics
 *     description: Retrieve comprehensive statistics about plans (admin only)
 *     tags: [Plans - Admin]
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
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalPlans:
 *                       type: integer
 *                     activePlans:
 *                       type: integer
 *                     publicPlans:
 *                       type: integer
 *                     plansByType:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           count:
 *                             type: integer
 *                           totalSubscriptions:
 *                             type: integer
 *                           activeSubscriptions:
 *                             type: integer
 *                     popularPlans:
 *                       type: array
 *                       items:
 *                         type: object
 *                     subscriptionStats:
 *                       type: object
 *                       properties:
 *                         totalSubscriptions:
 *                           type: integer
 *                         activeSubscriptions:
 *                           type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Admin only
 */
router.get(
  "/admin/stats",
  authenticate,
  authorize("admin"),
  PlanController.getPlanStats
);

export default router;
