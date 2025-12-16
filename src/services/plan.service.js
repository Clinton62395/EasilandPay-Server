// services/plan.service.js
import Plan from "../models/Plan.models.js";
import { AppError } from "../utils/appError.utils.js";

// CREATE PLAN
export const createPlan = async (data) => {
  const plan = await Plan.create(data);
  if (plan.createdBy)
    await plan.populate("createdBy", "firstName lastName email");
  return plan;
};

// GET ALL PLANS
export const getAllPlans = async (query) => {
  const { planType, isActive, isPublic, page = 1, limit = 10 } = query;
  const filter = {};
  if (planType) filter.planType = planType;
  if (isActive !== undefined) filter.isActive = isActive === "true";
  if (isPublic !== undefined) filter.isPublic = isPublic === "true";

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const plans = await Plan.find(filter)
    .populate("createdBy", "firstName lastName email")
    .limit(parseInt(limit))
    .skip(skip)
    .sort({ createdAt: -1 });

  const total = await Plan.countDocuments(filter);
  return {
    plans,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
  };
};

// GET PLAN BY ID
export const getPlanById = async (id) => {
  const plan = await Plan.findById(id).populate(
    "createdBy",
    "firstName lastName email"
  );
  if (!plan) throw new AppError("Plan not found", 404);
  return plan;
};

// UPDATE PLAN
export const updatePlan = async (id, updates) => {
  const plan = await Plan.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).populate("createdBy", "firstName lastName email");
  if (!plan) throw new AppError("Plan not found", 404);
  return plan;
};

// DELETE PLAN
export const deletePlan = async (id) => {
  const plan = await Plan.findById(id);
  if (!plan) throw new AppError("Plan not found", 404);
  if (plan.activeSubscriptions > 0) {
    throw new AppError(
      `Cannot delete plan with ${plan.activeSubscriptions} active subscriptions. Deactivate it instead.`,
      400
    );
  }
  await Plan.findByIdAndDelete(id);
  return { message: "plan deleted successful", plan };
};

// DEACTIVATE PLAN
export const deactivatePlan = async (id) => {
  const plan = await Plan.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );
  if (!plan) throw new AppError("Plan not found", 404);
  return plan;
};

// ACTIVATE PLAN
export const activatePlan = async (id) => {
  const plan = await Plan.findByIdAndUpdate(
    id,
    { isActive: true },
    { new: true }
  );
  if (!plan) throw new AppError("Plan not found", 404);
  return plan;
};

// GET ACTIVE PLANS
export const getActivePlans = async () => {
  const plans = await Plan.findActive();
  return plans;
};

// GET PLANS BY TYPE
export const getPlansByType = async (planType) => {
  const validTypes = [
    "installment",
    "savings",
    "mortgage",
    "investment",
    "rental",
  ];
  if (!validTypes.includes(planType))
    throw new AppError("Invalid plan type", 400);
  const plans = await Plan.findByType(planType);
  return plans;
};

// FIND PLANS FOR AMOUNT
export const findPlansForAmount = async (amount, planType) => {
  const amountInKobo = parseInt(amount);
  let plans = await Plan.findForAmount(amountInKobo);
  if (planType) plans = plans.filter((p) => p.planType === planType);
  return { plans, amountInKobo };
};

// CALCULATE PLAN INSTALLMENTS
export const calculatePlan = async (id, amount) => {
  const plan = await Plan.findById(id);
  if (!plan) throw new AppError("Plan not found", 404);
  if (!plan.isActive)
    throw new AppError("This plan is currently not active", 400);
  if (!plan.isAmountValid(amount)) {
    throw new AppError(
      `Amount must be between ${plan.minAmount / 100} and ${
        plan.maxAmount / 100
      } NGN`,
      400
    );
  }
  const calculation = plan.calculateInstallmentAmount(amount);
  return { plan, calculation };
};

// GET PLAN STATISTICS
export const getPlanStats = async () => {
  const totalPlans = await Plan.countDocuments();
  const activePlans = await Plan.countDocuments({ isActive: true });
  const publicPlans = await Plan.countDocuments({ isPublic: true });

  const plansByType = await Plan.aggregate([
    {
      $group: {
        _id: "$planType",
        count: { $sum: 1 },
        totalSubscriptions: { $sum: "$totalSubscriptions" },
        activeSubscriptions: { $sum: "$activeSubscriptions" },
      },
    },
  ]);

  const popularPlans = await Plan.find()
    .sort({ totalSubscriptions: -1 })
    .limit(5)
    .select("name planType totalSubscriptions activeSubscriptions");

  const subscriptionStats = await Plan.aggregate([
    {
      $group: {
        _id: null,
        totalSubscriptions: { $sum: "$totalSubscriptions" },
        activeSubscriptions: { $sum: "$activeSubscriptions" },
      },
    },
  ]);

  return {
    totalPlans,
    activePlans,
    publicPlans,
    plansByType,
    popularPlans,
    subscriptionStats: subscriptionStats[0] || {
      totalSubscriptions: 0,
      activeSubscriptions: 0,
    },
  };
};
