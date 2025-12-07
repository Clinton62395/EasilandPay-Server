import Plan from "../models/PaymentPlan.js";
import { AppError } from "../utils/appError.utils.js";
import { catchAsynch } from "../utils/catchAsynch.utils.js";


// ============================================
// CREATE A NEW PLAN
// ============================================
/**
 * @desc    Create a new payment plan
 * @route   POST /api/plans
 * @access  Private (Admin/Staff)
 */
export const createPlan = catchAsynch(async (req, res, next) => {
  // All validations are handled by express-validator middleware
  const newPlan = await Plan.create(req.body);

  // Populate creator if provided
  if (newPlan.createdBy) {
    await newPlan.populate("createdBy", "firstName lastName email");
  }

  res.status(201).json({
    success: true,
    message: "Plan created successfully",
    data: newPlan,
  });
});

// ============================================
// GET ALL PLANS
// ============================================
/**
 * @desc    Get all plans with optional filters
 * @route   GET /api/plans
 * @query   planType, isActive, isPublic, page, limit
 * @access  Public
 */
export const getAllPlans = catchAsynch(async (req, res, next) => {
  // All query validations are handled by express-validator middleware
  const { planType, isActive, isPublic, page = 1, limit = 10 } = req.query;

  // Build filter dynamically
  const filter = {};
  if (planType) filter.planType = planType;
  if (isActive !== undefined) filter.isActive = isActive === "true";
  if (isPublic !== undefined) filter.isPublic = isPublic === "true";

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get plans with filter and pagination
  const plans = await Plan.find(filter)
    .populate("createdBy", "firstName lastName email")
    .limit(parseInt(limit))
    .skip(skip)
    .sort({ createdAt: -1 });

  // Get total count for pagination
  const total = await Plan.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: plans.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: plans,
  });
});

// ============================================
// GET PLAN BY ID
// ============================================
/**
 * @desc    Get a single plan by ID
 * @route   GET /api/plans/:id
 * @access  Public
 */
export const getPlanById = catchAsynch(async (req, res, next) => {
  // ID validation is handled by express-validator middleware
  const { id } = req.params;

  const plan = await Plan.findById(id).populate(
    "createdBy",
    "firstName lastName email"
  );

  if (!plan) {
    return next(new AppError("Plan not found", 404));
  }

  res.status(200).json({
    success: true,
    data: plan,
  });
});

// ============================================
// UPDATE PLAN
// ============================================
/**
 * @desc    Update plan information
 * @route   PUT /api/plans/:id
 * @access  Private (Admin/Staff)
 */
export const updatePlan = catchAsynch(async (req, res, next) => {
  // All validations are handled by express-validator middleware
  const { id } = req.params;
  const updates = req.body;

  const plan = await Plan.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).populate("createdBy", "firstName lastName email");

  if (!plan) {
    return next(new AppError("Plan not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Plan updated successfully",
    data: plan,
  });
});

// ============================================
// DELETE PLAN
// ============================================
/**
 * @desc    Delete a plan
 * @route   DELETE /api/plans/:id
 * @access  Private (Admin only)
 */
export const deletePlan = catchAsynch(async (req, res, next) => {
  // ID validation is handled by express-validator middleware
  const { id } = req.params;

  const plan = await Plan.findById(id);

  if (!plan) {
    return next(new AppError("Plan not found", 404));
  }

  // Check if plan has active subscriptions
  if (plan.activeSubscriptions > 0) {
    return next(
      new AppError(
        `Cannot delete plan with ${plan.activeSubscriptions} active subscriptions. Deactivate it instead.`,
        400
      )
    );
  }

  await Plan.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: "Plan deleted successfully",
  });
});

// ============================================
// DEACTIVATE PLAN
// ============================================
/**
 * @desc    Deactivate a plan (soft delete)
 * @route   PATCH /api/plans/:id/deactivate
 * @access  Private (Admin/Staff)
 */
export const deactivatePlan = catchAsynch(async (req, res, next) => {
  const { id } = req.params;

  const plan = await Plan.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );

  if (!plan) {
    return next(new AppError("Plan not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Plan deactivated successfully",
    data: plan,
  });
});

// ============================================
// ACTIVATE PLAN
// ============================================
/**
 * @desc    Activate a plan
 * @route   PATCH /api/plans/:id/activate
 * @access  Private (Admin/Staff)
 */
export const activatePlan = catchAsynch(async (req, res, next) => {
  const { id } = req.params;

  const plan = await Plan.findByIdAndUpdate(
    id,
    { isActive: true },
    { new: true }
  );

  if (!plan) {
    return next(new AppError("Plan not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Plan activated successfully",
    data: plan,
  });
});

// ============================================
// GET ACTIVE PLANS
// ============================================
/**
 * @desc    Get all active public plans
 * @route   GET /api/plans/active
 * @access  Public
 */
export const getActivePlans = catchAsynch(async (req, res, next) => {
  const plans = await Plan.findActive();

  res.status(200).json({
    success: true,
    count: plans.length,
    data: plans,
  });
});

// ============================================
// GET PLANS BY TYPE
// ============================================
/**
 * @desc    Get all plans by type
 * @route   GET /api/plans/type/:planType
 * @access  Public
 */
export const getPlansByType = catchAsynch(async (req, res, next) => {
  const { planType } = req.params;

  const validTypes = [
    "installment",
    "savings",
    "mortgage",
    "investment",
    "rental",
  ];
  if (!validTypes.includes(planType)) {
    return next(new AppError("Invalid plan type", 400));
  }

  const plans = await Plan.findByType(planType);

  res.status(200).json({
    success: true,
    count: plans.length,
    data: plans,
  });
});

// ============================================
// FIND PLANS FOR AMOUNT
// ============================================
/**
 * @desc    Find suitable plans for a specific amount
 * @route   GET /api/plans/find-for-amount?amount=5000000
 * @access  Public
 */
export const findPlansForAmount = catchAsynch(async (req, res, next) => {
  // Validation is handled by express-validator middleware
  const { amount, planType } = req.query;
  const amountInKobo = parseInt(amount);

  let plans = await Plan.findForAmount(amountInKobo);

  // Filter by plan type if provided
  if (planType) {
    plans = plans.filter((plan) => plan.planType === planType);
  }

  res.status(200).json({
    success: true,
    count: plans.length,
    amount: amountInKobo / 100,
    amountInKobo,
    data: plans,
  });
});

// ============================================
// CALCULATE PLAN INSTALLMENTS
// ============================================
/**
 * @desc    Calculate installment breakdown for a plan and amount
 * @route   POST /api/plans/:id/calculate
 * @access  Public
 */
export const calculatePlan = catchAsynch(async (req, res, next) => {
  // Validations are handled by express-validator middleware
  const { id } = req.params;
  const { amount } = req.body;

  const plan = await Plan.findById(id);

  if (!plan) {
    return next(new AppError("Plan not found", 404));
  }

  if (!plan.isActive) {
    return next(new AppError("This plan is currently not active", 400));
  }

  // Check if amount is within plan range
  if (!plan.isAmountValid(amount)) {
    return next(
      new AppError(
        `Amount must be between ${plan.minAmount / 100} and ${
          plan.maxAmount / 100
        } NGN`,
        400
      )
    );
  }

  // Calculate installment breakdown
  const calculation = plan.calculateInstallmentAmount(amount);

  res.status(200).json({
    success: true,
    data: {
      plan: {
        id: plan._id,
        name: plan.name,
        duration: plan.duration,
        durationInMonths: plan.durationInMonths,
        interestRate: plan.interestRate,
        numberOfInstallments: plan.numberOfInstallments,
        installmentFrequency: plan.installmentFrequency,
      },
      calculation,
    },
  });
});

// ============================================
// GET PLAN STATISTICS
// ============================================
/**
 * @desc    Get plan statistics
 * @route   GET /api/plans/stats/summary
 * @access  Private (Admin/Staff)
 */
export const getPlanStats = catchAsynch(async (req, res, next) => {
  // Total plans
  const totalPlans = await Plan.countDocuments();
  const activePlans = await Plan.countDocuments({ isActive: true });
  const publicPlans = await Plan.countDocuments({ isPublic: true });

  // Plans by type
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

  // Most popular plans
  const popularPlans = await Plan.find()
    .sort({ totalSubscriptions: -1 })
    .limit(5)
    .select("name planType totalSubscriptions activeSubscriptions");

  // Total subscriptions
  const subscriptionStats = await Plan.aggregate([
    {
      $group: {
        _id: null,
        totalSubscriptions: { $sum: "$totalSubscriptions" },
        activeSubscriptions: { $sum: "$activeSubscriptions" },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalPlans,
      activePlans,
      publicPlans,
      plansByType,
      popularPlans,
      subscriptionStats: subscriptionStats[0] || {
        totalSubscriptions: 0,
        activeSubscriptions: 0,
      },
    },
  });
});
