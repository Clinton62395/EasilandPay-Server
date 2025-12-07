import express from "express";
import {
  cancelEscrow,
  completeMilestone,
  createEscrow,
  getAllEscrows,
  getEscrowById,
  getEscrowStats,
  initiateDispute,
  recordPayment,
  releaseFunds,
  resolveDispute,
  updateEscrow,
} from "../controllers/escrow.controller.js";
import {
  cancelEscrowValidator,
  completeMilestoneValidator,
  createEscrowValidator,
  getAllEscrowsValidator,
  getEscrowByIdValidator,
  initiateDisputeValidator,
  recordPaymentValidator,
  releaseFundsValidator,
  resolveDisputeValidator,
  updateEscrowValidator,
} from "../validations/escrow.validators.js";

const router = express.Router();

// ============================================
// ESCROW ROUTES WITH VALIDATION MIDDLEWARE
// ============================================

/**
 * @route   POST /api/escrows
 * @desc    Create a new escrow
 * @access  Private (Buyer/Admin)
 */
router.post("/", createEscrowValidator, createEscrow);

/**
 * @route   GET /api/escrows
 * @desc    Get all escrows with optional filters
 * @query   buyerId, propertyId, realtorId, status, page, limit
 * @access  Private (Admin/Staff)
 * @example /api/escrows?buyerId=123&status=ACTIVE&page=1&limit=10
 */
router.get("/", getAllEscrowsValidator, getAllEscrows);

/**
 * @route   GET /api/escrows/stats/summary
 * @desc    Get escrow statistics
 * @access  Private (Admin/Staff)
 */
router.get("/stats/summary", getEscrowStats);

/**
 * @route   GET /api/escrows/:id
 * @desc    Get a single escrow by ID
 * @param   id - Escrow ID
 * @access  Private (Buyer/Realtor/Admin)
 */
router.get("/:id", getEscrowByIdValidator, getEscrowById);

/**
 * @route   PUT /api/escrows/:id
 * @desc    Update escrow information
 * @param   id - Escrow ID
 * @access  Private (Admin/Staff)
 */
router.put("/:id", updateEscrowValidator, updateEscrow);

/**
 * @route   POST /api/escrows/:id/payment
 * @desc    Record a payment for escrow
 * @param   id - Escrow ID
 * @body    amountInKobo, transactionId, installmentIndex (optional)
 * @access  Private (Buyer/Admin)
 * @example POST /api/escrows/507f1f77bcf86cd799439011/payment
 *          Body: {
 *            "amountInKobo": 500000,
 *            "transactionId": "507f...",
 *            "installmentIndex": 0
 *          }
 */
router.post("/:id/payment", recordPaymentValidator, recordPayment);

/**
 * @route   POST /api/escrows/:id/dispute
 * @desc    Initiate a dispute for escrow
 * @param   id - Escrow ID
 * @body    userId, reason
 * @access  Private (Buyer/Realtor)
 * @example POST /api/escrows/507f1f77bcf86cd799439011/dispute
 *          Body: {
 *            "userId": "507f...",
 *            "reason": "Property condition not as described..."
 *          }
 */
router.post("/:id/dispute", initiateDisputeValidator, initiateDispute);

/**
 * @route   PATCH /api/escrows/:id/dispute/resolve
 * @desc    Resolve a dispute (Admin only)
 * @param   id - Escrow ID
 * @body    adminId, resolution, newStatus
 * @access  Private (Admin/Staff)
 * @example PATCH /api/escrows/507f.../dispute/resolve
 *          Body: {
 *            "adminId": "507f...",
 *            "resolution": "Issue resolved in favor of buyer...",
 *            "newStatus": "ACTIVE"
 *          }
 */
router.patch("/:id/dispute/resolve", resolveDisputeValidator, resolveDispute);

/**
 * @route   POST /api/escrows/:id/release
 * @desc    Release funds from escrow
 * @param   id - Escrow ID
 * @body    amountInKobo, reason (optional)
 * @access  Private (Admin/Staff)
 * @example POST /api/escrows/507f.../release
 *          Body: {
 *            "amountInKobo": 1000000,
 *            "reason": "Milestone completed"
 *          }
 */
router.post("/:id/release", releaseFundsValidator, releaseFunds);

/**
 * @route   PATCH /api/escrows/:id/cancel
 * @desc    Cancel an escrow
 * @param   id - Escrow ID
 * @body    reason
 * @access  Private (Admin/Buyer)
 * @example PATCH /api/escrows/507f.../cancel
 *          Body: { "reason": "Buyer changed mind" }
 */
router.patch("/:id/cancel", cancelEscrowValidator, cancelEscrow);

/**
 * @route   PATCH /api/escrows/:id/milestones/:milestoneIndex/complete
 * @desc    Mark a milestone as completed
 * @param   id - Escrow ID
 * @param   milestoneIndex - Milestone array index
 * @access  Private (Admin/Staff)
 * @example PATCH /api/escrows/507f.../milestones/0/complete
 */
router.patch(
  "/:id/milestones/:milestoneIndex/complete",
  completeMilestoneValidator,
  completeMilestone
);

export default router;
