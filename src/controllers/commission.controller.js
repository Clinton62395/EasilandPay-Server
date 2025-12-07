import Commission from "../models/Commission.js";
import User from "../models/User.js";
import { AppError } from "../utils/appError.utils.js";
import { catchAsynch } from "../utils/catchAsynch.utils.js";

// ============================================
// CREATE A NEW COMMISSION
// ============================================
/**
 * @desc    Create a new commission record
 * @route   POST /api/commissions
 * @access  Private (Admin/Staff)
 */
export const createCommission = catchAsynch(async (req, res, next) => {
  // All validations are handled by express-validator middleware
  const newCommission = await Commission.create(req.body);

  // Populate references for complete response
  await newCommission.populate([
    { path: "realtorId", select: "firstName lastName email realtorInfo" },
    { path: "escrowId", select: "escrowCode status totalAmountInKobo" },
    { path: "propertyId", select: "title location priceInKobo" },
    { path: "buyerId", select: "firstName lastName email" },
  ]);

  res.status(201).json({
    success: true,
    message: "Commission created successfully",
    data: newCommission,
  });
});

// ============================================
// GET ALL COMMISSIONS
// ============================================
/**
 * @desc    Get all commissions with optional filters
 * @route   GET /api/commissions
 * @query   realtorId, status, page, limit
 * @access  Private (Admin/Staff/Realtor)
 */
export const getAllCommissions = catchAsynch(async (req, res, next) => {
  // All query validations are handled by express-validator middleware
  const { realtorId, status, page = 1, limit = 10 } = req.query;
 
  // Build filter dynamically
  const filter = {};
  if (realtorId) filter.realtorId = realtorId;
  if (status) filter.status = status;

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get commissions with filter and pagination
  const commissions = await Commission.find(filter)
    .populate("realtorId", "firstName lastName email realtorInfo")
    .populate("escrowId", "escrowCode status")
    .populate("propertyId", "title location")
    .populate("buyerId", "firstName lastName email")
    .limit(parseInt(limit))
    .skip(skip)
    .sort({ createdAt: -1 });

  // Get total count for pagination
  const total = await Commission.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: commissions.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: commissions,
  });
});

// ============================================
// GET COMMISSION BY ID
// ============================================
/**
 * @desc    Get a single commission by ID
 * @route   GET /api/commissions/:id
 * @access  Private (Admin/Staff/Realtor)
 */
export const getCommissionById = catchAsynch(async (req, res, next) => {
  // ID validation is handled by express-validator middleware
  const { id } = req.params;

  const commission = await Commission.findById(id)
    .populate("realtorId", "firstName lastName email phoneNumber realtorInfo")
    .populate("escrowId", "escrowCode status totalAmountInKobo")
    .populate("propertyId", "title location priceInKobo")
    .populate("buyerId", "firstName lastName email")
    .populate("withdrawalRequests.approvedBy", "firstName lastName")
    .populate("withdrawalRequests.transactionId")
    .populate("paymentTransactions.transactionId");

  if (!commission) {
    return next(new AppError("Commission not found", 404));
  }

  res.status(200).json({
    success: true,
    data: commission,
  });
});

// ============================================
// UPDATE COMMISSION
// ============================================
/**
 * @desc    Update commission information
 * @route   PUT /api/commissions/:id
 * @access  Private (Admin/Staff)
 */
export const updateCommission = catchAsynch(async (req, res, next) => {
  // All validations are handled by express-validator middleware
  const { id } = req.params;
  const updates = req.body;

  const commission = await Commission.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  })
    .populate("realtorId", "firstName lastName email realtorInfo")
    .populate("escrowId", "escrowCode status")
    .populate("propertyId", "title location")
    .populate("buyerId", "firstName lastName email");

  if (!commission) {
    return next(new AppError("Commission not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Commission updated successfully",
    data: commission,
  });
});

// ============================================
// DELETE COMMISSION
// ============================================
/**
 * @desc    Delete a commission (only if status is PENDING or CANCELLED)
 * @route   DELETE /api/commissions/:id
 * @access  Private (Admin only)
 */
export const deleteCommission = catchAsynch(async (req, res, next) => {
  // ID validation is handled by express-validator middleware
  const { id } = req.params;

  const commission = await Commission.findById(id);

  if (!commission) {
    return next(new AppError("Commission not found", 404));
  }

  // Only allow deletion if commission is PENDING or CANCELLED
  if (commission.status !== "PENDING" && commission.status !== "CANCELLED") {
    return next(
      new AppError(
        "Cannot delete commission with status PARTIAL or PAID. Cancel it first.",
        400
      )
    );
  }

  await Commission.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: "Commission deleted successfully",
  });
});

// ============================================
// GET COMMISSIONS BY REALTOR
// ============================================
/**
 * @desc    Get all commissions for a specific realtor
 * @route   GET /api/commissions/realtor/:realtorId
 * @access  Private (Admin/Staff/Realtor - own commissions)
 */
export const getCommissionsByRealtor = catchAsynch(async (req, res, next) => {
  // RealtorId validation is handled by express-validator middleware
  const { realtorId } = req.params;
  const { status, page = 1, limit = 10 } = req.query;

  // Build filter
  const filter = { realtorId };
  if (status) filter.status = status;

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get commissions
  const commissions = await Commission.find(filter)
    .populate("escrowId", "escrowCode status")
    .populate("propertyId", "title location")
    .populate("buyerId", "firstName lastName")
    .limit(parseInt(limit))
    .skip(skip)
    .sort({ createdAt: -1 });

  const total = await Commission.countDocuments(filter);

  // Calculate totals
  const totals = await Commission.aggregate([
    { $match: { realtorId: mongoose.Types.ObjectId(realtorId) } },
    {
      $group: {
        _id: null,
        totalEarned: { $sum: "$totalCommissionInKobo" },
        totalPaid: { $sum: "$paidCommissionInKobo" },
      },
    },
  ]);

  const summary = totals[0] || { totalEarned: 0, totalPaid: 0 };

  res.status(200).json({
    success: true,
    count: commissions.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    summary: {
      totalEarnedInKobo: summary.totalEarned,
      totalEarned: summary.totalEarned / 100,
      totalPaidInKobo: summary.totalPaid,
      totalPaid: summary.totalPaid / 100,
      pendingInKobo: summary.totalEarned - summary.totalPaid,
      pending: (summary.totalEarned - summary.totalPaid) / 100,
    },
    data: commissions,
  });
});

// ============================================
// REQUEST WITHDRAWAL
// ============================================
/**
 * @desc    Realtor requests commission withdrawal
 * @route   POST /api/commissions/:id/withdraw
 * @access  Private (Realtor - own commission)
 */
export const requestWithdrawal = catchAsynch(async (req, res, next) => {
  // Validations are handled by express-validator middleware
  const { id } = req.params;
  const { amountInKobo } = req.body;

  const commission = await Commission.findById(id);

  if (!commission) {
    return next(new AppError("Commission not found", 404));
  }

  // Check if there's enough pending commission
  const pending =
    commission.totalCommissionInKobo - commission.paidCommissionInKobo;

  if (amountInKobo > pending) {
    return next(
      new AppError(
        `Insufficient commission balance. Available: ${pending / 100} NGN`,
        400
      )
    );
  }

  // Use the model method to request withdrawal
  await commission.requestWithdrawal(amountInKobo);

  // Populate for response
  await commission.populate(
    "realtorId",
    "firstName lastName email realtorInfo"
  );

  res.status(200).json({
    success: true,
    message: "Withdrawal request submitted successfully",
    data: commission,
  });
});

// ============================================
// APPROVE/REJECT WITHDRAWAL REQUEST
// ============================================
/**
 * @desc    Admin approves or rejects withdrawal request
 * @route   PATCH /api/commissions/:id/withdraw/:requestId
 * @access  Private (Admin/Staff)
 */
export const processWithdrawalRequest = catchAsynch(async (req, res, next) => {
  // Validations are handled by express-validator middleware
  const { id, requestId } = req.params;
  const { action, rejectionReason, adminId } = req.body;

  const commission = await Commission.findById(id);

  if (!commission) {
    return next(new AppError("Commission not found", 404));
  }

  // Find the withdrawal request
  const withdrawalRequest = commission.withdrawalRequests.id(requestId);

  if (!withdrawalRequest) {
    return next(new AppError("Withdrawal request not found", 404));
  }

  if (withdrawalRequest.status !== "PENDING") {
    return next(
      new AppError(
        `Withdrawal request has already been ${withdrawalRequest.status.toLowerCase()}`,
        400
      )
    );
  }

  if (action === "APPROVED") {
    withdrawalRequest.status = "APPROVED";
    withdrawalRequest.approvedBy = adminId;
    withdrawalRequest.approvedAt = new Date();
  } else if (action === "REJECTED") {
    withdrawalRequest.status = "REJECTED";
    withdrawalRequest.approvedBy = adminId;
    withdrawalRequest.approvedAt = new Date();
    withdrawalRequest.rejectionReason = rejectionReason;
  } else {
    return next(new AppError("Invalid action. Use APPROVED or REJECTED", 400));
  }

  await commission.save();

  res.status(200).json({
    success: true,
    message: `Withdrawal request ${action.toLowerCase()} successfully`,
    data: commission,
  });
});

// ============================================
// MARK WITHDRAWAL AS PROCESSED
// ============================================
/**
 * @desc    Mark withdrawal as processed after payment
 * @route   PATCH /api/commissions/:id/withdraw/:requestId/processed
 * @access  Private (Admin/Staff)
 */
export const markWithdrawalProcessed = catchAsynch(async (req, res, next) => {
  // Validations are handled by express-validator middleware
  const { id, requestId } = req.params;
  const { transactionId } = req.body;

  const commission = await Commission.findById(id);

  if (!commission) {
    return next(new AppError("Commission not found", 404));
  }

  const withdrawalRequest = commission.withdrawalRequests.id(requestId);

  if (!withdrawalRequest) {
    return next(new AppError("Withdrawal request not found", 404));
  }

  if (withdrawalRequest.status !== "APPROVED") {
    return next(
      new AppError("Only approved withdrawal requests can be processed", 400)
    );
  }

  // Update withdrawal request
  withdrawalRequest.status = "PROCESSED";
  withdrawalRequest.processedAt = new Date();
  withdrawalRequest.transactionId = transactionId;

  // Update paid commission
  commission.paidCommissionInKobo += withdrawalRequest.amountInKobo;

  // Add to payment transactions
  commission.paymentTransactions.push({
    transactionId,
    amountInKobo: withdrawalRequest.amountInKobo,
    paidAt: new Date(),
  });

  // Update commission status
  if (commission.paidCommissionInKobo >= commission.totalCommissionInKobo) {
    commission.status = "PAID";
  } else if (commission.paidCommissionInKobo > 0) {
    commission.status = "PARTIAL";
  }

  await commission.save();

  // Update realtor's total commission stats
  await User.findByIdAndUpdate(commission.realtorId, {
    $inc: {
      "realtorInfo.totalCommissionPaid": withdrawalRequest.amountInKobo,
    },
  });

  res.status(200).json({
    success: true,
    message: "Withdrawal processed successfully",
    data: commission,
  });
});

// ============================================
// GET COMMISSION STATISTICS
// ============================================
/**
 * @desc    Get commission statistics
 * @route   GET /api/commissions/stats/summary
 * @access  Private (Admin/Staff)
 */
export const getCommissionStats = catchAsynch(async (req, res, next) => {
  const stats = await Commission.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$totalCommissionInKobo" },
        paidAmount: { $sum: "$paidCommissionInKobo" },
      },
    },
  ]);

  // Overall totals
  const overall = await Commission.aggregate([
    {
      $group: {
        _id: null,
        totalCommissions: { $sum: 1 },
        totalEarned: { $sum: "$totalCommissionInKobo" },
        totalPaid: { $sum: "$paidCommissionInKobo" },
      },
    },
  ]);

  // Pending withdrawal requests
  const pendingWithdrawals = await Commission.aggregate([
    { $unwind: "$withdrawalRequests" },
    { $match: { "withdrawalRequests.status": "PENDING" } },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        totalAmount: { $sum: "$withdrawalRequests.amountInKobo" },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      byStatus: stats,
      overall: overall[0] || {
        totalCommissions: 0,
        totalEarned: 0,
        totalPaid: 0,
      },
      pendingWithdrawals: pendingWithdrawals[0] || { count: 0, totalAmount: 0 },
    },
  });
});

// ============================================
// CANCEL COMMISSION
// ============================================
/**
 * @desc    Cancel a commission (only if no payments made)
 * @route   PATCH /api/commissions/:id/cancel
 * @access  Private (Admin only)
 */
export const cancelCommission = catchAsynch(async (req, res, next) => {
  const { id } = req.params;
  const { reason } = req.body;

  const commission = await Commission.findById(id);

  if (!commission) {
    return next(new AppError("Commission not found", 404));
  }

  if (commission.paidCommissionInKobo > 0) {
    return next(
      new AppError("Cannot cancel commission with payments already made", 400)
    );
  }

  commission.status = "CANCELLED";
  await commission.save();

  res.status(200).json({
    success: true,
    message: "Commission cancelled successfully",
    data: commission,
  });
});
