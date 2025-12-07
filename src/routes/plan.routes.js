import express from "express";
import {
  calculatePlanValidator,
  createPlanValidator,
  deletePlanValidator,
  findPlansForAmountValidator,
  getAllPlansValidator,
  getPlanByIdValidator,
  updatePlanValidator,
} from "../validations/plan.validators.js";
import {
  activatePlan,
  calculatePlan,
  createPlan,
  deactivatePlan,
  deletePlan,
  findPlansForAmount,
  getActivePlans,
  getAllPlans,
  getPlanById,
  getPlansByType,
  getPlanStats,
  updatePlan,
} from "../controllers/plan.controller.js";

const router = express.Router();

// ============================================
// PLAN ROUTES WITH VALIDATION MIDDLEWARE
// ============================================

/**
 * @route   POST /api/plans
 * @desc    Create a new payment plan
 * @access  Private (Admin/Staff)
 */
router.post("/", createPlanValidator, createPlan);

/**
 * @route   GET /api/plans
 * @desc    Get all plans with optional filters
 * @query   planType, isActive, isPublic, page, limit
 * @access  Public
 * @example /api/plans?planType=installment&isActive=true&page=1&limit=10
 */
router.get("/", getAllPlansValidator, getAllPlans);

/**
 * @route   GET /api/plans/stats/summary
 * @desc    Get plan statistics
 * @access  Private (Admin/Staff)
 */
router.get("/stats/summary", getPlanStats);

/**
 * @route   GET /api/plans/active
 * @desc    Get all active public plans
 * @access  Public
 */
router.get("/active", getActivePlans);

/**
 * @route   GET /api/plans/find-for-amount
 * @desc    Find suitable plans for a specific amount
 * @query   amount (required in kobo), planType (optional)
 * @access  Public
 * @example /api/plans/find-for-amount?amount=5000000&planType=installment
 */
router.get("/find-for-amount", findPlansForAmountValidator, findPlansForAmount);

/**
 * @route   GET /api/plans/type/:planType
 * @desc    Get all plans by type
 * @param   planType - Plan type (installment, savings, mortgage, investment, rental)
 * @access  Public
 * @example /api/plans/type/mortgage
 */
router.get("/type/:planType", getPlansByType);

/**
 * @route   GET /api/plans/:id
 * @desc    Get a single plan by ID
 * @param   id - Plan ID
 * @access  Public
 */
router.get("/:id", getPlanByIdValidator, getPlanById);

/**
 * @route   PUT /api/plans/:id
 * @desc    Update plan information
 * @param   id - Plan ID
 * @access  Private (Admin/Staff)
 */
router.put("/:id", updatePlanValidator, updatePlan);

/**
 * @route   DELETE /api/plans/:id
 * @desc    Delete a plan (only if no active subscriptions)
 * @param   id - Plan ID
 * @access  Private (Admin only)
 */
router.delete("/:id", deletePlanValidator, deletePlan);

/**
 * @route   POST /api/plans/:id/calculate
 * @desc    Calculate installment breakdown for a plan and amount
 * @param   id - Plan ID
 * @body    amount (required in kobo)
 * @access  Public
 * @example POST /api/plans/507f1f77bcf86cd799439011/calculate
 *          Body: { "amount": 5000000 }
 */
router.post("/:id/calculate", calculatePlanValidator, calculatePlan);

/**
 * @route   PATCH /api/plans/:id/deactivate
 * @desc    Deactivate a plan (soft delete)
 * @param   id - Plan ID
 * @access  Private (Admin/Staff)
 */
router.patch("/:id/deactivate", getPlanByIdValidator, deactivatePlan);

/**
 *
 * @route   PATCH /api/plans/:id/activate
 * @desc    Activate a plan
 * @param   id - Plan ID
 * @access  Private (Admin/Staff)
 */
router.patch("/:id/activate", getPlanByIdValidator, activatePlan);

export default router;
