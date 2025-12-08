import { catchAsynch } from "../utils/catchAsynch.utils.js";
import { AppError } from "../utils/appError.utils.js";
import Commission from "../models/Commission.js";
import {
  submitWithdrawalRequest,
  processWithdrawalRequest,
  markWithdrawalProcessed,
  getRealtorCommissionSummary,
} from "../services/commissionService.js";

// POST /api/commissions/:id/withdraw
export const requestWithdrawal = catchAsynch(async (req, res, next) => {
  const { id } = req.params;
  const { amountInKobo } = req.body;

  const commission = await Commission.findById(id);
  if (!commission) return next(new AppError("Commission not found", 404));

  await submitWithdrawalRequest(commission, amountInKobo);

  res.status(200).json({
    success: true,
    message: "Withdrawal request submitted successfully",
    data: commission,
  });
});

// PATCH /api/commissions/:id/withdraw/:requestId
export const handleWithdrawalRequest = catchAsynch(async (req, res, next) => {
  const { id, requestId } = req.params;
  const { action, rejectionReason, adminId } = req.body;

  const commission = await Commission.findById(id);
  if (!commission) return next(new AppError("Commission not found", 404));

  await processWithdrawalRequest(
    commission,
    requestId,
    action,
    adminId,
    rejectionReason
  );

  res.status(200).json({
    success: true,
    message: `Withdrawal request ${action.toLowerCase()} successfully`,
    data: commission,
  });
});

// PATCH /api/commissions/:id/withdraw/:requestId/processed
export const processWithdrawalPayment = catchAsynch(async (req, res, next) => {
  const { id, requestId } = req.params;
  const { transactionId } = req.body;

  const commission = await Commission.findById(id);
  if (!commission) return next(new AppError("Commission not found", 404));

  await markWithdrawalProcessed(commission, requestId, transactionId);

  res.status(200).json({
    success: true,
    message: "Withdrawal processed successfully",
    data: commission,
  });
});

// GET /api/commissions/realtor/:realtorId/summary
export const realtorSummary = catchAsynch(async (req, res, next) => {
  const { realtorId } = req.params;
  const summary = await getRealtorCommissionSummary(realtorId);

  res.status(200).json({
    success: true,
    data: summary,
  });
});
