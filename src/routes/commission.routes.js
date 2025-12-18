import express from "express";
import * as CommissionController from "../controllers/commission.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

/**
 * @swagger
 * /commission:
 *   post:
 *     summary: Create a new commission record
 *     description: Create a commission record for a realtor (admin only)
 *     tags: [Commissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - realtorId
 *               - propertyId
 *               - totalCommissionInKobo
 *             properties:
 *               realtorId:
 *                 type: string
 *               propertyId:
 *                 type: string
 *               transactionId:
 *                 type: string
 *               totalCommissionInKobo:
 *                 type: integer
 *               commissionPercentage:
 *                 type: number
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Commission created successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Admin only
 */
router.post(
  "/",
  authenticate,
  authorize("admin"),
  CommissionController.createCommission
);

/**
 * @swagger
 * /commission:
 *   get:
 *     summary: Get all commissions
 *     description: Retrieve commissions with filters (admin only)
 *     tags: [Commissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: realtorId
 *         schema:
 *           type: string
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PARTIAL, PAID]
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
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
 *         description: List of commissions
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Admin only
 */
router.get(
  "/",
  authenticate,
  authorize("admin"),
  CommissionController.getAllCommissions
);

/**
 * @swagger
 * /commission/realtor:
 *   get:
 *     summary: Get realtor's commissions
 *     description: Retrieve commissions for the authenticated realtor
 *     tags: [Commissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Realtor's commissions
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  "/realtor",
  authenticate,
  authorize("realtor"),
  CommissionController.getRealtorCommissions
);

/**
 * @swagger
 * /commission/{id}:
 *   get:
 *     summary: Get commission by ID
 *     description: Retrieve a specific commission
 *     tags: [Commissions]
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
 *         description: Commission details
 *       404:
 *         description: Commission not found
 */
router.get(
  "/:id",
  authenticate,
  authorize("admin", "realtor"),
  CommissionController.getCommissionById
);

/**
 * @swagger
 * /commission/{id}/payment:
 *   post:
 *     summary: Add commission payment
 *     description: Record a payment for a commission (admin only)
 *     tags: [Commissions]
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
 *             required:
 *               - amountInKobo
 *               - paymentMethod
 *             properties:
 *               amountInKobo:
 *                 type: integer
 *               paymentMethod:
 *                 type: string
 *               reference:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment added successfully
 *       400:
 *         description: Payment exceeds pending commission
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Admin only
 */
router.post(
  "/:id/payment",
  authenticate,
  authorize("admin"),
  CommissionController.addCommissionPayment
);

/**
 * @swagger
 * /commission/withdraw:
 *   post:
 *     summary: Submit withdrawal request
 *     description: Submit a withdrawal request for commissions (realtor only)
 *     tags: [Commissions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amountInKobo
 *               - bankDetails
 *             properties:
 *               amountInKobo:
 *                 type: integer
 *               bankDetails:
 *                 type: object
 *                 properties:
 *                   accountNumber:
 *                     type: string
 *                   bankName:
 *                     type: string
 *                   accountName:
 *                     type: string
 *     responses:
 *       200:
 *         description: Withdrawal request submitted
 *       400:
 *         description: Insufficient commission balance
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Realtor only
 */
router.post(
  "/withdraw",
  authenticate,
  authorize("realtor"),
  CommissionController.submitWithdrawalRequest
);

// ============================================
// ADMIN ROUTES
// ============================================

/**
 * @swagger
 * /commission/admin/withdraw/{requestId}/process:
 *   put:
 *     summary: Process withdrawal request
 *     description: Approve or reject a withdrawal request (admin only)
 *     tags: [Commissions - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [APPROVE, REJECT]
 *               rejectionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Withdrawal request processed
 *       400:
 *         description: Invalid action or insufficient funds
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Admin only
 */
router.put(
  "/admin/withdraw/:requestId/process",
  authenticate,
  authorize("admin"),
  CommissionController.processWithdrawalRequest
);

/**
 * @swagger
 * /commission/admin/withdraw/{requestId}/paid:
 *   put:
 *     summary: Mark withdrawal as paid
 *     description: Mark a withdrawal request as processed/paid (admin only)
 *     tags: [Commissions - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transactionId
 *             properties:
 *               transactionId:
 *                 type: string
 *               paymentDetails:
 *                 type: object
 *     responses:
 *       200:
 *         description: Withdrawal marked as paid
 *       400:
 *         description: Request not approved
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Admin only
 */
router.put(
  "/admin/withdraw/:requestId/paid",
  authenticate,
  authorize("admin"),
  CommissionController.markWithdrawalProcessed
);

/**
 * @swagger
 * /commission/admin/stats:
 *   get:
 *     summary: Get commission statistics
 *     description: Get comprehensive commission statistics (admin only)
 *     tags: [Commissions - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: realtorId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Commission statistics
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Admin only
 */
router.get(
  "/admin/stats",
  authenticate,
  authorize("admin"),
  CommissionController.getCommissionStats
);

/**
 * @swagger
 * /commission/admin/calculate:
 *   post:
 *     summary: Calculate property commission
 *     description: Calculate commission for a property sale (admin only)
 *     tags: [Commissions - Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - propertyId
 *               - saleAmount
 *               - commissionPercentage
 *             properties:
 *               propertyId:
 *                 type: string
 *               saleAmount:
 *                 type: integer
 *               commissionPercentage:
 *                 type: number
 *     responses:
 *       200:
 *         description: Commission calculation
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Admin only
 */
router.post(
  "/admin/calculate",
  authenticate,
  authorize("admin"),
  CommissionController.calculatePropertyCommission
);

export default router;
