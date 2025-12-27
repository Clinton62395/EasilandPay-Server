import express from "express";
import WalletController from "../controllers/wallet.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

/**
 * @swagger
 * /wallet:
 *   get:
 *     summary: Get current user's wallet
 *     description: Retrieve wallet details and balance for the authenticated user
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Wallet'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Wallet not found
 */
router.get(
  "/",
  authenticate,
  authorize("admin", "buyer", "seller", "realtor", "user"),
  WalletController.getWallet
);

/**
 * @swagger
 * /wallet/deposit:
 *   post:
 *     summary: Deposit funds to wallet
 *     description: Add funds to user's wallet (requires payment reference)
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - reference
 *             properties:
 *               amount:
 *                 type: integer
 *                 description: Amount to deposit in kobo (100 kobo = 1 Naira)
 *                 example: 1000000
 *               reference:
 *                 type: string
 *                 description: Payment reference from payment gateway
 *                 example: PAY_1234567890
 *               description:
 *                 type: string
 *                 description: Optional description for the transaction
 *                 example: Wallet funding via bank transfer
 *               metadata:
 *                 type: object
 *                 properties:
 *                   paymentMethod:
 *                     type: string
 *                     example: card
 *                   gateway:
 *                     type: string
 *                     example: paystack
 *     responses:
 *       200:
 *         description: Wallet funded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Wallet'
 *       400:
 *         description: Invalid amount or reference
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  "/deposit",
  authenticate,
  authorize("admin", "buyer", "seller", "realtor", "user"),
  WalletController.deposit
);

/**
 * @swagger
 * /wallet/escrow:
 *   post:
 *     summary: Move funds to escrow
 *     description: Hold funds in escrow for property purchase or reservation
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - propertyId
 *             properties:
 *               amount:
 *                 type: integer
 *                 description: Amount to move to escrow in kobo
 *                 example: 10000000
 *               propertyId:
 *                 type: string
 *                 description: ID of the property for escrow
 *                 example: 507f1f77bcf86cd799439011
 *               description:
 *                 type: string
 *                 description: Optional description
 *                 example: Reservation deposit for property purchase
 *               metadata:
 *                 type: object
 *                 properties:
 *                   reservationId:
 *                     type: string
 *                   contractId:
 *                     type: string
 *     responses:
 *       200:
 *         description: Funds moved to escrow successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Wallet'
 *       400:
 *         description: Insufficient balance or invalid property
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  "/escrow",
  authenticate,
  authorize("admin", "buyer"),
  WalletController.moveToEscrow
);

/**
 * @swagger
 * /wallet/escrow/release:
 *   post:
 *     summary: Release escrow funds
 *     description: Release escrow funds to seller or return to buyer (requires admin or buyer)
 *     tags: [Wallet]
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
 *             properties:
 *               propertyId:
 *                 type: string
 *                 description: ID of the property associated with escrow
 *                 example: 507f1f77bcf86cd799439011
 *               sellerId:
 *                 type: string
 *                 description: ID of the seller to release funds to
 *                 example: 507f1f77bcf86cd799439012
 *               realtorId:
 *                 type: string
 *                 description: ID of the realtor for commission
 *                 example: 507f1f77bcf86cd799439013
 *               description:
 *                 type: string
 *                 example: Property purchase completed successfully
 *               metadata:
 *                 type: object
 *                 properties:
 *                   contractId:
 *                     type: string
 *                   commissionPercentage:
 *                     type: number
 *                     example: 5
 *     responses:
 *       200:
 *         description: Escrow funds released successfully
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
 *                     message:
 *                       type: string
 *                     wallet:
 *                       $ref: '#/components/schemas/Wallet'
 *       400:
 *         description: Invalid escrow transaction or insufficient funds
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  "/escrow/release",
  authenticate,
  authorize("admin", "buyer"),
  WalletController.releaseEscrow
);

/**
 * @swagger
 * /wallet/withdraw:
 *   post:
 *     summary: Withdraw from wallet
 *     description: Make payment or withdraw funds from wallet
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
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
 *                 description: Amount to withdraw in kobo
 *                 example: 500000
 *               description:
 *                 type: string
 *                 description: Reason for the withdrawal
 *                 example: Property purchase payment
 *               metadata:
 *                 type: object
 *                 properties:
 *                   propertyId:
 *                     type: string
 *                     example: 507f1f77bcf86cd799439011
 *                   planId:
 *                     type: string
 *                     example: 507f1f77bcf86cd799439012
 *                   beneficiaryDetails:
 *                     type: object
 *                     properties:
 *                       accountNumber:
 *                         type: string
 *                       bankName:
 *                         type: string
 *                       accountName:
 *                         type: string
 *     responses:
 *       200:
 *         description: Withdrawal successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Wallet'
 *       400:
 *         description: Insufficient balance
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  "/withdraw",
  authenticate,
  authorize("admin", "buyer", "seller", "realtor", "user"),
  WalletController.withdraw
);

// ============================================
// ADMIN ROUTES
// ============================================

/**
 * @swagger
 * /wallet/admin/user/{user}:
 *   get:
 *     summary: Get user's wallet (Admin)
 *     description: Retrieve wallet details for any user (admin only)
 *     tags: [Wallet - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Wallet retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Admin only
 *       404:
 *         description: Wallet not found
 */
router.get(
  "/admin/user/:user",
  authenticate,
  authorize("admin"),
  WalletController.releaseEscrow
);

/**
 * @swagger
 * /wallet/admin/transactions:
 *   get:
 *     summary: Get all wallet transactions (Admin)
 *     description: Retrieve transaction history for all users with filters (admin only)
 *     tags: [Wallet - Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [WALLET_DEPOSIT, WALLET_WITHDRAWAL, ESCROW_DEPOSIT, COMMISSION_PAYMENT, ESCROW_REFUND]
 *         description: Filter by transaction type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, SUCCESS, FAILED, CANCELLED, HOLD]
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
 *         description: Admin only
 */

export default router;
