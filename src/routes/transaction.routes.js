import express from "express";
import * as TransactionController from "../controllers/transaction.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

/**
 * @swagger
 * /api/transactions/me:
 *   get:
 *     summary: Get current user transactions
 *     description: Retrieve transaction history for the currently logged-in user with optional filters
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [CREDIT, DEBIT, COMMISSION, REFUND]
 *         description: Filter by transaction type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, SUCCESS, FAILED, CANCELLED]
 *         description: Filter by transaction status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering (YYYY-MM-DD)
 *         example: "2024-01-01"
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering (YYYY-MM-DD)
 *         example: "2024-12-31"
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
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
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
 *                     transactions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Transaction'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get("/me", authenticate, TransactionController.getUserTransactions);

/**
 * @swagger
 * /api/transactions/me/summary:
 *   get:
 *     summary: Get current user transaction summary
 *     description: Get a summary of transactions grouped by type and current wallet balance
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Summary retrieved successfully
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
 *                     summary:
 *                       type: object
 *                       properties:
 *                         currentBalance:
 *                           type: number
 *                           description: Current wallet balance in kobo
 *                           example: 5000000
 *                         summary:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 example: CREDIT
 *                               totalAmount:
 *                                 type: number
 *                                 example: 10000000
 *                               count:
 *                                 type: integer
 *                                 example: 5
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get(
  "/me/summary",
  authenticate,
  TransactionController.getUserTransactionSummary
);

/**
 * @swagger
 * /api/transactions/credit:
 *   post:
 *     summary: Credit wallet
 *     description: Add funds to user wallet (funding/top-up)
 *     tags: [Transactions]
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
 *             properties:
 *               amountInKobo:
 *                 type: integer
 *                 description: Amount in kobo (100 kobo = 1 Naira)
 *                 example: 1000000
 *               description:
 *                 type: string
 *                 example: Wallet funding via card
 *               metadata:
 *                 type: object
 *                 properties:
 *                   paymentGateway:
 *                     type: string
 *                     example: paystack
 *                   paymentMethod:
 *                     type: string
 *                     example: card
 *                   gatewayReference:
 *                     type: string
 *                     example: PAY_123456789
 *     responses:
 *       201:
 *         description: Wallet credited successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Wallet credited successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     transaction:
 *                       $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Invalid amount or insufficient balance
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post("/credit", authenticate, TransactionController.creditWallet);

/**
 * @swagger
 * /api/transactions/debit:
 *   post:
 *     summary: Debit wallet
 *     description: Withdraw or make payment from wallet
 *     tags: [Transactions]
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
 *             properties:
 *               amountInKobo:
 *                 type: integer
 *                 description: Amount in kobo (100 kobo = 1 Naira)
 *                 example: 500000
 *               description:
 *                 type: string
 *                 example: Property payment
 *               metadata:
 *                 type: object
 *                 properties:
 *                   propertyId:
 *                     type: string
 *                     example: 507f1f77bcf86cd799439011
 *                   planId:
 *                     type: string
 *                     example: 507f1f77bcf86cd799439012
 *                   bankDetails:
 *                     type: object
 *                     properties:
 *                       accountNumber:
 *                         type: string
 *                       bankName:
 *                         type: string
 *                       accountName:
 *                         type: string
 *     responses:
 *       201:
 *         description: Wallet debited successfully
 *       400:
 *         description: Insufficient wallet balance
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post("/debit", authenticate, TransactionController.debitWallet);

/**
 * @swagger
 * /api/transactions/{id}/cancel:
 *   put:
 *     summary: Cancel transaction
 *     description: Cancel a pending transaction
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction cancelled successfully
 *       400:
 *         description: Cannot cancel non-pending transaction
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Transaction not found
 */
router.put(
  "/:id/cancel",
  authenticate,
  TransactionController.cancelTransaction
);

/**
 * @swagger
 * /api/transactions/reference/{reference}:
 *   get:
 *     summary: Get transaction by reference
 *     description: Retrieve a specific transaction using its unique reference
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction reference
 *         example: CREDIT_1234567890_507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Transaction retrieved successfully
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
 *                     transaction:
 *                       $ref: '#/components/schemas/Transaction'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Transaction not found
 */
router.get(
  "/reference/:reference",
  authenticate,
  TransactionController.getTransactionByReference
);

/**
 * @swagger
 * /api/transactions/{id}:
 *   get:
 *     summary: Get transaction by ID
 *     description: Retrieve a specific transaction by its ID
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction retrieved successfully
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
 *                     transaction:
 *                       $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: Invalid transaction ID
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Transaction not found
 */
router.get("/:id", authenticate, TransactionController.getTransactionById);

// ============================================
// ADMIN/STAFF ROUTES
// ============================================

/**
 * @swagger
 * /api/transactions/admin/all:
 *   get:
 *     summary: Get all transactions (Admin/Staff)
 *     description: Retrieve all transactions across all users with filters and pagination
 *     tags: [Transactions - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [CREDIT, DEBIT, COMMISSION, REFUND]
 *         description: Filter by transaction type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, SUCCESS, FAILED, CANCELLED]
 *         description: Filter by transaction status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by reference or description
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Admin/Staff only
 */
router.get(
  "/admin/all",
  authenticate,
  authorize("admin", "staff"),
  TransactionController.getAllTransactions
);

/**
 * @swagger
 * /api/transactions/admin/statistics:
 *   get:
 *     summary: Get transaction statistics (Admin/Staff)
 *     description: Get overall transaction statistics including totals by type and status
 *     tags: [Transactions - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for statistics
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for statistics
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
 *                     stats:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: object
 *                           properties:
 *                             totalTransactions:
 *                               type: integer
 *                             totalAmount:
 *                               type: number
 *                             successfulTransactions:
 *                               type: integer
 *                             failedTransactions:
 *                               type: integer
 *                         byType:
 *                           type: array
 *                           items:
 *                             type: object
 *                         byStatus:
 *                           type: array
 *                           items:
 *                             type: object
 *                         recentTransactions:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Transaction'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Admin/Staff only
 */
router.get(
  "/admin/statistics",
  authenticate,
  authorize("admin", "staff"),
  TransactionController.getTransactionStatistics
);

/**
 * @swagger
 * /api/transactions/admin/create:
 *   post:
 *     summary: Create transaction manually (Admin/Staff)
 *     description: Manually create a transaction for any user
 *     tags: [Transactions - Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - type
 *               - amountInKobo
 *             properties:
 *               userId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *               type:
 *                 type: string
 *                 enum: [CREDIT, DEBIT, COMMISSION, REFUND]
 *                 example: CREDIT
 *               amountInKobo:
 *                 type: integer
 *                 example: 1000000
 *               description:
 *                 type: string
 *                 example: Manual adjustment
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *       400:
 *         description: Invalid data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Admin/Staff only
 */
router.post(
  "/admin/create",
  authenticate,
  authorize("admin", "staff"),
  TransactionController.createTransaction
);

/**
 * @swagger
 * /api/transactions/admin/{id}/status:
 *   put:
 *     summary: Update transaction status (Admin/Staff)
 *     description: Update the status of a transaction (SUCCESS, FAILED, CANCELLED)
 *     tags: [Transactions - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [SUCCESS, FAILED, CANCELLED]
 *                 example: SUCCESS
 *               metadata:
 *                 type: object
 *                 properties:
 *                   errorMessage:
 *                     type: string
 *                   paystackResponse:
 *                     type: object
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Cannot update non-pending transaction
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Admin/Staff only
 *       404:
 *         description: Transaction not found
 */
router.put(
  "/admin/:id/status",
  authenticate,
  authorize("admin", "staff"),
  TransactionController.updateTransactionStatus
);

/**
 * @swagger
 * /api/transactions/admin/commission:
 *   post:
 *     summary: Pay commission to realtor (Admin)
 *     description: Process commission payment to a realtor
 *     tags: [Transactions - Admin]
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
 *               - amountInKobo
 *               - originalTransactionId
 *             properties:
 *               realtorId:
 *                 type: string
 *                 description: Realtor user ID
 *                 example: 507f1f77bcf86cd799439011
 *               amountInKobo:
 *                 type: integer
 *                 description: Commission amount in kobo
 *                 example: 500000
 *               originalTransactionId:
 *                 type: string
 *                 description: ID of the original transaction
 *                 example: 507f1f77bcf86cd799439012
 *               metadata:
 *                 type: object
 *                 properties:
 *                   commissionPercentage:
 *                     type: number
 *                     example: 5
 *                   propertyId:
 *                     type: string
 *     responses:
 *       201:
 *         description: Commission paid successfully
 *       400:
 *         description: Invalid data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Admin only
 */
router.post(
  "/admin/commission",
  authenticate,
  authorize("admin"),
  TransactionController.payCommission
);

/**
 * @swagger
 * /api/transactions/admin/refund:
 *   post:
 *     summary: Process refund (Admin)
 *     description: Issue a refund to a user
 *     tags: [Transactions - Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - amountInKobo
 *               - originalTransactionId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID to refund
 *                 example: 507f1f77bcf86cd799439011
 *               amountInKobo:
 *                 type: integer
 *                 description: Refund amount in kobo
 *                 example: 1000000
 *               originalTransactionId:
 *                 type: string
 *                 description: ID of the original transaction
 *                 example: 507f1f77bcf86cd799439012
 *               metadata:
 *                 type: object
 *                 properties:
 *                   reason:
 *                     type: string
 *                     example: Property cancelled
 *     responses:
 *       201:
 *         description: Refund processed successfully
 *       400:
 *         description: Invalid data
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Forbidden - Admin only
 */
router.post(
  "/admin/refund",
  authenticate,
  authorize("admin"),
  TransactionController.refundTransaction
);

export default router;
