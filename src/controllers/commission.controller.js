import { catchAsynch } from "../utils/catchAsynch.utils.js";
import CommissionService from "../services/commission.service.js";

// Create commission
export const createCommission = catchAsynch(async (req, res) => {
  const commission = await CommissionService.createCommission(req.body);
  res.status(201).json({
    success: true,
    message: "Commission created successfully",
    data: commission,
  });
});

// Get all commissions
export const getAllCommissions = catchAsynch(async (req, res) => {
  const result = await CommissionService.getAllCommissions(req.query);
  res.status(200).json({
    success: true,
    count: result.commissions.length,
    total: result.total,
    page: result.page,
    pages: result.pages,
    data: result.commissions,
  });
});

// Get commission by ID
export const getCommissionById = catchAsynch(async (req, res) => {
  const commission = await CommissionService.getCommissionById(req.params.id);
  res.status(200).json({
    success: true,
    data: commission,
  });
});

// Get realtor commissions
export const getRealtorCommissions = catchAsynch(async (req, res) => {
  const realtorId = req.params.realtorId || req.user.id;
  const result = await CommissionService.getRealtorCommissions(
    realtorId,
    req.query
  );

  res.status(200).json({
    success: true,
    data: {
      commissions: result.commissions,
      totals: result.totals,
      pagination: {
        total: result.total,
        page: result.page,
        pages: result.pages,
      },
    },
  });
});

// Add commission payment
export const addCommissionPayment = catchAsynch(async (req, res) => {
  const commission = await CommissionService.addCommissionPayment(
    req.params.id,
    req.body
  );

  res.status(200).json({
    success: true,
    message: "Commission payment added successfully",
    data: commission,
  });
});

// Submit withdrawal request
export const submitWithdrawalRequest = catchAsynch(async (req, res) => {
  const { amountInKobo, bankDetails } = req.body;
  const commissionSummary = await CommissionService.submitWithdrawalRequest(
    req.user.id,
    amountInKobo,
    bankDetails
  );

  res.status(200).json({
    success: true,
    message: "Withdrawal request submitted successfully",
    data: commissionSummary,
  });
});

// Process withdrawal request (approve/reject)
export const processWithdrawalRequest = catchAsynch(async (req, res) => {
  const { action, rejectionReason } = req.body;
  const result = await CommissionService.processWithdrawalRequest(
    req.params.requestId,
    action,
    req.user.id,
    rejectionReason
  );

  res.status(200).json({
    success: true,
    message: `Withdrawal request ${action.toLowerCase()} successfully`,
    data: result,
  });
});

// Mark withdrawal as processed
export const markWithdrawalProcessed = catchAsynch(async (req, res) => {
  const { transactionId, paymentDetails } = req.body;
  const result = await CommissionService.markWithdrawalProcessed(
    req.params.requestId,
    transactionId,
    paymentDetails
  );

  res.status(200).json({
    success: true,
    message: "Withdrawal marked as processed successfully",
    data: result,
  });
});

// Get commission statistics
export const getCommissionStats = catchAsynch(async (req, res) => {
  const stats = await CommissionService.getCommissionStats(req.query);
  res.status(200).json({
    success: true,
    data: stats,
  });
});

// Calculate property commission
export const calculatePropertyCommission = catchAsynch(async (req, res) => {
  const { propertyId, saleAmount, commissionPercentage } = req.body;
  const calculation = await CommissionService.calculatePropertyCommission(
    propertyId,
    saleAmount,
    commissionPercentage
  );

  res.status(200).json({
    success: true,
    data: calculation,
  });
});
