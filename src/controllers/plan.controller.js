// controllers/plan.controller.js
import { catchAsynch } from "../utils/catchAsynch.utils.js";
import { AppError } from "../utils/appError.utils.js";
import * as planService from "../services/plan.service.js";

// ============================================
// CREATE PLAN
// ============================================
export const createPlan = catchAsynch(async (req, res, next) => {
  const newPlan = await planService.createPlan(req.body);
  res.status(201).json({
    success: true,
    message: "Plan created successfully",
    data: newPlan,
  });
});

// ============================================
// GET ALL PLANS
// ============================================
export const getAllPlans = catchAsynch(async (req, res, next) => {
  const result = await planService.getAllPlans(req.query);
  res.status(200).json({
    success: true,
    count: result.plans.length,
    total: result.total,
    page: result.page,
    pages: result.pages,
    data: result.plans,
  });
});

// ============================================
// GET PLAN BY ID
// ============================================
export const getPlanById = catchAsynch(async (req, res, next) => {
  const plan = await planService.getPlanById(req.params.id);
  res.status(200).json({ success: true, data: plan });
});

// ============================================
// UPDATE PLAN
// ============================================
export const updatePlan = catchAsynch(async (req, res, next) => {
  const plan = await planService.updatePlan(req.params.id, req.body);
  res.status(200).json({
    success: true,
    message: "Plan updated successfully",
    data: plan,
  });
});

// ============================================
// DELETE PLAN
// ============================================
export const deletePlan = catchAsynch(async (req, res, next) => {
  await planService.deletePlan(req.params.id);
  res.status(200).json({
    success: true,
    message: "Plan deleted successfully",
  });
});

// ============================================
// DEACTIVATE PLAN
// ============================================
export const deactivatePlan = catchAsynch(async (req, res, next) => {
  const plan = await planService.deactivatePlan(req.params.id);
  res.status(200).json({
    success: true,
    message: "Plan deactivated successfully",
    data: plan,
  });
});

// ============================================
// ACTIVATE PLAN
// ============================================
export const activatePlan = catchAsynch(async (req, res, next) => {
  const plan = await planService.activatePlan(req.params.id);
  res.status(200).json({
    success: true,
    message: "Plan activated successfully",
    data: plan,
  });
});

// ============================================
// GET ACTIVE PLANS
// ============================================
export const getActivePlans = catchAsynch(async (req, res, next) => {
  const plans = await planService.getActivePlans();
  res.status(200).json({
    success: true,
    count: plans.length,
    data: plans,
  });
});

// ============================================
// GET PLANS BY TYPE
// ============================================
export const getPlansByType = catchAsynch(async (req, res, next) => {
  const plans = await planService.getPlansByType(req.params.planType);
  res.status(200).json({
    success: true,
    count: plans.length,
    data: plans,
  });
});

// ============================================
// FIND PLANS FOR AMOUNT
// ============================================
export const findPlansForAmount = catchAsynch(async (req, res, next) => {
  const { amount, planType } = req.query;
  const result = await planService.findPlansForAmount(amount, planType);
  res.status(200).json({
    success: true,
    count: result.plans.length,
    amount: result.amountInKobo / 100,
    amountInKobo: result.amountInKobo,
    data: result.plans,
  });
});

// ============================================
// CALCULATE PLAN INSTALLMENTS
// ============================================
export const calculatePlan = catchAsynch(async (req, res, next) => {
  const { amount } = req.body;
  const result = await planService.calculatePlan(req.params.id, amount);

  res.status(200).json({
    success: true,
    data: {
      plan: {
        id: result.plan._id,
        name: result.plan.name,
        duration: result.plan.duration,
        durationInMonths: result.plan.durationInMonths,
        interestRate: result.plan.interestRate,
        numberOfInstallments: result.plan.numberOfInstallments,
        installmentFrequency: result.plan.installmentFrequency,
      },
      calculation: result.calculation,
    },
  });
});

// ============================================
// GET PLAN STATISTICS
// ============================================
export const getPlanStats = catchAsynch(async (req, res, next) => {
  const stats = await planService.getPlanStats();
  res.status(200).json({ success: true, data: stats });
});
