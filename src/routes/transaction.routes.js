// routes/depositWebhook.js
import express from "express";
import {
  cancelTransaction,
  createTransaction,
  creditWallet,
  debitWallet,
  getTransactionById,
  getTransactionByReference,
  getTransactionStatistics,
  getUserTransactions,
  getUserTransactionSummary,
  payCommission,
  refundTransaction,
  updateTransactionStatus,
} from "../controllers/transaction.controller.js";
import { authorize, authenticate } from "../middlewares/auth.middleware.js";

const router = express.Router();

// ============================================
// authenticateED ROUTES (Authentication required)
// ============================================

/**
 * @route   GET /api/transactions/me
 * @desc    Get current user transactions
 * @access  Private
 */
router.get("/me", authenticate, getUserTransactions);

/**
 * @route   GET /api/transactions/me/summary
 * @desc    Get current user transaction summary
 * @access  Private
 */
router.get("/me/summary", authenticate, getUserTransactionSummary);

/**
 * @route   POST /api/transactions/credit
 * @desc    Credit wallet (funding)
 * @access  Private
 */
router.post("/credit", authenticate, creditWallet);

/**
 * @route   POST /api/transactions/debit
 * @desc    Debit wallet (withdrawal/payment)
 * @access  Private
 */
router.post("/debit", authenticate, debitWallet);

/**
 * @route   PUT /api/transactions/:id/cancel
 * @desc    Cancel transaction
 * @access  Private
 */
router.put("/:id/cancel", authenticate, cancelTransaction);

/**
 * @route   GET /api/transactions/reference/:reference
 * @desc    Get transaction by reference
 * @access  Private
 */
router.get("/reference/:reference", authenticate, getTransactionByReference);

/**
 * @route   GET /api/transactions/:id
 * @desc    Get transaction by ID
 * @access  Private
 */
router.get("/:id", authenticate, getTransactionById);

// ============================================
// ADMIN/STAFF ROUTES
// ============================================

/**
 * @route   GET /api/transactions/admin/statistics
 * @desc    Get transaction statistics
 * @access  Private (Admin/Staff)
 */
router.get(
  "/admin/statistics",
  authenticate,
  authorize("admin", "staff"),
  getTransactionStatistics
);

/**
 * @route   POST /api/transactions/admin/create
 * @desc    Create transaction (manual)
 * @access  Private (Admin/Staff)
 */
router.post(
  "/admin/create",
  authenticate,
  authorize("admin", "staff"),
  createTransaction
);

/**
 * @route   PUT /api/transactions/admin/:id/status
 * @desc    Update transaction status
 * @access  Private (Admin/Staff)
 */
router.put(
  "/admin/:id/status",
  authenticate,
  authorize("admin", "staff"),
  updateTransactionStatus
);

/**
 * @route   POST /api/transactions/admin/commission
 * @desc    Pay commission to realtor
 * @access  Private (Admin only)
 */
router.post(
  "/admin/commission",
  authenticate,
  authorize("admin"),
  payCommission
);

/**
 * @route   POST /api/transactions/admin/refund
 * @desc    Process refund
 * @access  Private (Admin only)
 */
router.post(
  "/admin/refund",
  authenticate,
  authorize("admin"),
  refundTransaction
);

export default router;
