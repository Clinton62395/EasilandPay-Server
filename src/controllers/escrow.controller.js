import Escrow from "../models/Escrow.models.js";
import { AppError } from "../utils/appError.utils.js";
import { catchAsynch } from "../utils/catchAsynch.utils.js";

// ============================================
// CREATE ESCROW
// ============================================
/**
 * @desc    Create a new escrow
 * @route   POST /api/escrows
 * @access  Private (Buyer/Admin)
 */
export const createEscrow = catchAsynch(async (req, res, next) => {
  // All validations are handled by express-validator middleware
  const newEscrow = await Escrow.create(req.body);

  // Populate references
  await newEscrow.populate([
    { path: "propertyId", select: "title location priceInKobo" },
    { path: "buyerId", select: "firstName lastName email" },
    { path: "realtorId", select: "firstName lastName email realtorInfo" },
  ]);

  // Create commission record if realtor exists
  if (newEscrow.realtorId && newEscrow.commission.amountInKobo > 0) {
    await Commission.create({
      realtorId: newEscrow.realtorId,
      escrowId: newEscrow._id,
      propertyId: newEscrow.propertyId,
      buyerId: newEscrow.buyerId,
      totalCommissionInKobo: newEscrow.commission.amountInKobo,
      commissionPercentage: newEscrow.commission.percentage,
      status: "PENDING",
    });
  }

  res.status(201).json({
    success: true,
    message: "Escrow created successfully",
    data: newEscrow,
  });
});

// ============================================
// GET ALL ESCROWS
// ============================================
/**
 * @desc    Get all escrows with optional filters
 * @route   GET /api/escrows
 * @query   buyerId, propertyId, realtorId, status, page, limit
 * @access  Private (Admin/Staff)
 */
export const getAllEscrows = catchAsynch(async (req, res, next) => {
  const {
    buyerId,
    propertyId,
    realtorId,
    status,
    page = 1,
    limit = 10,
  } = req.query;

  // Build filter dynamically
  const filter = {};
  if (buyerId) filter.buyerId = buyerId;
  if (propertyId) filter.propertyId = propertyId;
  if (realtorId) filter.realtorId = realtorId;
  if (status) filter.status = status;

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get escrows with filter and pagination
  const escrows = await Escrow.find(filter)
    .populate("propertyId", "title location priceInKobo")
    .populate("buyerId", "firstName lastName email")
    .populate("realtorId", "firstName lastName email")
    .limit(parseInt(limit))
    .skip(skip)
    .sort({ createdAt: -1 });

  // Get total count
  const total = await Escrow.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: escrows.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: escrows,
  });
});

// ============================================
// GET ESCROW BY ID
// ============================================
/**
 * @desc    Get a single escrow by ID
 * @route   GET /api/escrows/:id
 * @access  Private (Buyer/Realtor/Admin)
 */
export const getEscrowById = catchAsynch(async (req, res, next) => {
  const { id } = req.params;

  const escrow = await Escrow.findById(id)
    .populate("propertyId")
    .populate("buyerId", "firstName lastName email phoneNumber")
    .populate("realtorId", "firstName lastName email phoneNumber realtorInfo")
    .populate("paymentPlan.installments.transactionId")
    .populate("commission.transactionId")
    .populate("dispute.initiatedBy", "firstName lastName email")
    .populate("dispute.resolvedBy", "firstName lastName email");

  if (!escrow) {
    return next(new AppError("Escrow not found", 404));
  }

  res.status(200).json({
    success: true,
    data: escrow,
  });
});

// ============================================
// UPDATE ESCROW
// ============================================
/**
 * @desc    Update escrow information
 * @route   PUT /api/escrows/:id
 * @access  Private (Admin/Staff)
 */
export const updateEscrow = catchAsynch(async (req, res, next) => {
  const { id } = req.params;
  const updates = req.body;

  const escrow = await Escrow.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  })
    .populate("propertyId", "title location")
    .populate("buyerId", "firstName lastName email")
    .populate("realtorId", "firstName lastName email");

  if (!escrow) {
    return next(new AppError("Escrow not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Escrow updated successfully",
    data: escrow,
  });
});

// ============================================
// RECORD PAYMENT
// ============================================
/**
 * @desc    Record a payment for escrow
 * @route   POST /api/escrows/:id/payment
 * @access  Private (Buyer/Admin)
 */
export const recordPayment = catchAsynch(async (req, res, next) => {
  const { id } = req.params;
  const { amountInKobo, transactionId, installmentIndex } = req.body;

  const escrow = await Escrow.findById(id);

  if (!escrow) {
    return next(new AppError("Escrow not found", 404));
  }

  if (escrow.status === "COMPLETED") {
    return next(new AppError("Escrow is already completed", 400));
  }

  if (escrow.status === "CANCELLED") {
    return next(
      new AppError("Cannot record payment for cancelled escrow", 400)
    );
  }

  // Update paid amount
  escrow.paidAmountInKobo += amountInKobo;

  // Update specific installment if provided
  if (installmentIndex !== undefined) {
    const installment = escrow.paymentPlan.installments[installmentIndex];
    if (installment) {
      installment.status = "PAID";
      installment.paidAt = new Date();
      installment.transactionId = transactionId;
    }
  }

  // Update status
  if (escrow.status === "CREATED") {
    escrow.status = "ACTIVE";
  }

  // Check if fully paid
  if (escrow.isFullyPaid()) {
    escrow.status = "COMPLETED";
  }

  await escrow.save();

  res.status(200).json({
    success: true,
    message: "Payment recorded successfully",
    data: escrow,
  });
});

// ============================================
// INITIATE DISPUTE
// ============================================
/**
 * @desc    Initiate a dispute for escrow
 * @route   POST /api/escrows/:id/dispute
 * @access  Private (Buyer/Realtor)
 */
export const initiateDispute = catchAsynch(async (req, res, next) => {
  const { id } = req.params;
  const { userId, reason } = req.body;

  const escrow = await Escrow.findById(id);

  if (!escrow) {
    return next(new AppError("Escrow not found", 404));
  }

  if (escrow.status === "COMPLETED" || escrow.status === "CANCELLED") {
    return next(
      new AppError("Cannot dispute completed or cancelled escrow", 400)
    );
  }

  if (escrow.dispute.active) {
    return next(
      new AppError("A dispute is already active for this escrow", 400)
    );
  }

  // Use model method to initiate dispute
  await escrow.initiateDispute(userId, reason);

  await escrow.populate([
    { path: "dispute.initiatedBy", select: "firstName lastName email" },
  ]);

  res.status(200).json({
    success: true,
    message: "Dispute initiated successfully",
    data: escrow,
  });
});

// ============================================
// RESOLVE DISPUTE
// ============================================
/**
 * @desc    Resolve a dispute (Admin only)
 * @route   PATCH /api/escrows/:id/dispute/resolve
 * @access  Private (Admin/Staff)
 */
export const resolveDispute = catchAsynch(async (req, res, next) => {
  const { id } = req.params;
  const { adminId, resolution, newStatus } = req.body;

  const escrow = await Escrow.findById(id);

  if (!escrow) {
    return next(new AppError("Escrow not found", 404));
  }

  if (!escrow.dispute.active) {
    return next(new AppError("No active dispute found for this escrow", 400));
  }

  // Update dispute
  escrow.dispute.active = false;
  escrow.dispute.resolution = resolution;
  escrow.dispute.resolvedBy = adminId;
  escrow.dispute.resolvedAt = new Date();

  // Update escrow status
  escrow.status = newStatus;

  await escrow.save();

  await escrow.populate([
    { path: "dispute.initiatedBy", select: "firstName lastName email" },
    { path: "dispute.resolvedBy", select: "firstName lastName email" },
  ]);

  res.status(200).json({
    success: true,
    message: "Dispute resolved successfully",
    data: escrow,
  });
});

// ============================================
// RELEASE FUNDS
// ============================================
/**
 * @desc    Release funds from escrow
 * @route   POST /api/escrows/:id/release
 * @access  Private (Admin/Staff)
 */
export const releaseFunds = catchAsynch(async (req, res, next) => {
  const { id } = req.params;
  const { amountInKobo, reason } = req.body;

  const escrow = await Escrow.findById(id);

  if (!escrow) {
    return next(new AppError("Escrow not found", 404));
  }

  if (escrow.lockedAmountInKobo < amountInKobo) {
    return next(
      new AppError(
        `Insufficient locked funds. Available: ${
          escrow.lockedAmountInKobo / 100
        } NGN`,
        400
      )
    );
  }

  // Decrease locked amount
  escrow.lockedAmountInKobo -= amountInKobo;

  await escrow.save();

  res.status(200).json({
    success: true,
    message: "Funds released successfully",
    data: {
      releasedAmount: amountInKobo / 100,
      releasedAmountInKobo: amountInKobo,
      remainingLocked: escrow.lockedAmountInKobo / 100,
      remainingLockedInKobo: escrow.lockedAmountInKobo,
      reason,
    },
  });
});

// ============================================
// CANCEL ESCROW
// ============================================
/**
 * @desc    Cancel an escrow
 * @route   PATCH /api/escrows/:id/cancel
 * @access  Private (Admin/Buyer)
 */
export const cancelEscrow = catchAsynch(async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;

  const escrow = await Escrow.findById(id);

  if (!escrow) {
    return next(new AppError("Escrow not found", 404));
  }

  if (escrow.status === "COMPLETED") {
    return next(new AppError("Cannot cancel completed escrow", 400));
  }

  if (escrow.paidAmountInKobo > 0) {
    return next(
      new AppError(
        "Cannot cancel escrow with payments made. Initiate refund instead.",
        400
      )
    );
  }

  escrow.status = "CANCELLED";
  await escrow.save();

  res.status(200).json({
    success: true,
    message: "Escrow cancelled successfully",
    data: escrow,
  });
});

// ============================================
// COMPLETE MILESTONE
// ============================================
/**
 * @desc    Mark a milestone as completed
 * @route   PATCH /api/escrows/:id/milestones/:milestoneIndex/complete
 * @access  Private (Admin/Staff)
 */
export const completeMilestone = catchAsynch(async (req, res, next) => {
  const { id, milestoneIndex } = req.params;

  const escrow = await Escrow.findById(id);

  if (!escrow) {
    return next(new AppError("Escrow not found", 404));
  }

  const milestone = escrow.milestones[parseInt(milestoneIndex)];

  if (!milestone) {
    return next(new AppError("Milestone not found", 404));
  }

  if (milestone.completed) {
    return next(new AppError("Milestone already completed", 400));
  }

  // Mark milestone as completed
  milestone.completed = true;
  milestone.completedAt = new Date();

  // Calculate and set released amount
  const releaseAmount = Math.round(
    (escrow.totalAmountInKobo * milestone.percentage) / 100
  );
  milestone.releasedAmountInKobo = releaseAmount;

  // Update locked amount
  if (escrow.lockedAmountInKobo >= releaseAmount) {
    escrow.lockedAmountInKobo -= releaseAmount;
  }

  await escrow.save();

  res.status(200).json({
    success: true,
    message: "Milestone completed successfully",
    data: escrow,
  });
});

// ============================================
// GET ESCROW STATISTICS
// ============================================
/**
 * @desc    Get escrow statistics
 * @route   GET /api/escrows/stats/summary
 * @access  Private (Admin/Staff)
 */
export const getEscrowStats = catchAsynch(async (req, res, next) => {
  // Total escrows
  const totalEscrows = await Escrow.countDocuments();

  // Escrows by status
  const escrowsByStatus = await Escrow.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$totalAmountInKobo" },
        totalPaid: { $sum: "$paidAmountInKobo" },
      },
    },
  ]);

  // Total transaction volume
  const volumeStats = await Escrow.aggregate([
    {
      $group: {
        _id: null,
        totalVolume: { $sum: "$totalAmountInKobo" },
        totalPaid: { $sum: "$paidAmountInKobo" },
        totalLocked: { $sum: "$lockedAmountInKobo" },
      },
    },
  ]);

  // Active disputes
  const activeDisputes = await Escrow.countDocuments({
    "dispute.active": true,
  });

  // Recent escrows
  const recentEscrows = await Escrow.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("propertyId", "title")
    .populate("buyerId", "firstName lastName")
    .select("totalAmountInKobo status createdAt");

  res.status(200).json({
    success: true,
    data: {
      totalEscrows,
      escrowsByStatus,
      volumeStats: volumeStats[0] || {
        totalVolume: 0,
        totalPaid: 0,
        totalLocked: 0,
      },
      activeDisputes,
      recentEscrows,
    },
  });
});
