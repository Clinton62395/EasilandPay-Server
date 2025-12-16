import { body, param, query, validationResult } from "express-validator";
import User from "../models/Auth.models.js";

// ============================================
// MIDDLEWARE: Handle Validation Errors
// ============================================
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
        value: err.value,
      })),
    });
  }

  next();
};

// ============================================
// VALIDATOR: Create Plan
// ============================================
export const createPlanValidator = [
  // Name validation
  body("name")
    .notEmpty()
    .withMessage("Plan name is required")
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Plan name must be between 3 and 100 characters"),

  // Description validation (optional)
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),

  // Minimum amount validation
  body("minAmount")
    .notEmpty()
    .withMessage("Minimum amount is required")
    .isInt({ min: 0 })
    .withMessage("Minimum amount must be a non-negative integer (in kobo)"),

  // Maximum amount validation
  body("maxAmount")
    .notEmpty()
    .withMessage("Maximum amount is required")
    .isInt({ min: 0 })
    .withMessage("Maximum amount must be a non-negative integer (in kobo)")
    .custom((value, { req }) => {
      if (value < req.body.minAmount) {
        throw new Error(
          "Maximum amount must be greater than or equal to minimum amount"
        );
      }
      return true;
    }),

  // Duration validation
  body("duration")
    .notEmpty()
    .withMessage("Duration is required")
    .isInt({ min: 1, max: 3650 })
    .withMessage("Duration must be between 1 and 3650 days"),

  // Interest rate validation (optional)
  body("interestRate")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Interest rate must be between 0 and 100"),

  // Plan type validation
  body("planType")
    .notEmpty()
    .withMessage("Plan type is required")
    .isIn(["installment", "savings", "mortgage", "investment", "rental"])
    .withMessage("Invalid plan type"),

  // Number of installments validation (optional)
  body("numberOfInstallments")
    .optional()
    .isInt({ min: 1, max: 120 })
    .withMessage("Number of installments must be between 1 and 120"),

  // Installment frequency validation (optional)
  body("installmentFrequency")
    .optional()
    .isIn(["daily", "weekly", "biweekly", "monthly", "quarterly", "yearly"])
    .withMessage("Invalid installment frequency"),

  // Down payment percentage validation (optional)
  body("downPaymentPercentage")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Down payment percentage must be between 0 and 100"),

  // Late penalty percentage validation (optional)
  body("latePenaltyPercentage")
    .optional()
    .isFloat({ min: 0, max: 50 })
    .withMessage("Late penalty percentage must be between 0 and 50"),

  // Grace period validation (optional)
  body("gracePeriod")
    .optional()
    .isInt({ min: 0, max: 90 })
    .withMessage("Grace period must be between 0 and 90 days"),

  // Features validation (optional)
  body("features")
    .optional()
    .isArray()
    .withMessage("Features must be an array"),

  // Boolean validations
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value"),

  body("isPublic")
    .optional()
    .isBoolean()
    .withMessage("isPublic must be a boolean value"),

  // Eligible roles validation (optional)
  body("eligibleRoles")
    .optional()
    .isArray()
    .withMessage("Eligible roles must be an array")
    .custom((value) => {
      const validRoles = ["buyer", "realtor", "company", "staff", "admin"];
      const invalidRoles = value.filter((role) => !validRoles.includes(role));
      if (invalidRoles.length > 0) {
        throw new Error(`Invalid roles: ${invalidRoles.join(", ")}`);
      }
      return true;
    }),

  // Created by validation (optional)
  body("createdBy")
    .optional()
    .isMongoId()
    .withMessage("Invalid creator ID format")
    .custom(async (value) => {
      const user = await User.findById(value);
      if (!user) {
        throw new Error("Creator user not found");
      }
      if (user.role !== "admin" && user.role !== "staff") {
        throw new Error("Only admin or staff can create plans");
      }
      return true;
    }),

  handleValidationErrors,
];

// ============================================
// VALIDATOR: Update Plan
// ============================================
export const updatePlanValidator = [
  // ID parameter validation
  param("id")
    .notEmpty()
    .withMessage("Plan ID is required")
    .isMongoId()
    .withMessage("Invalid plan ID format"),

  // Name validation (optional)
  body("name")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("Plan name must be between 3 and 100 characters"),

  // Description validation (optional)
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),

  // Minimum amount validation (optional)
  body("minAmount")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Minimum amount must be a non-negative integer"),

  // Maximum amount validation (optional)
  body("maxAmount")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Maximum amount must be a non-negative integer"),

  // Duration validation (optional)
  body("duration")
    .optional()
    .isInt({ min: 1, max: 3650 })
    .withMessage("Duration must be between 1 and 3650 days"),

  // Interest rate validation (optional)
  body("interestRate")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Interest rate must be between 0 and 100"),

  // Plan type validation (optional)
  body("planType")
    .optional()
    .isIn(["installment", "savings", "mortgage", "investment", "rental"])
    .withMessage("Invalid plan type"),

  // Boolean validations
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value"),

  body("isPublic")
    .optional()
    .isBoolean()
    .withMessage("isPublic must be a boolean value"),

  handleValidationErrors,
];

// ============================================
// VALIDATOR: Get Plan By ID
// ============================================
export const getPlanByIdValidator = [
  param("id")
    .notEmpty()
    .withMessage("Plan ID is required")
    .isMongoId()
    .withMessage("Invalid plan ID format"),

  handleValidationErrors,
];

// ============================================
// VALIDATOR: Delete Plan
// ============================================
export const deletePlanValidator = [
  param("id")
    .notEmpty()
    .withMessage("Plan ID is required")
    .isMongoId()
    .withMessage("Invalid plan ID format"),

  handleValidationErrors,
];

// ============================================
// VALIDATOR: Get All Plans
// ============================================
export const getAllPlansValidator = [
  query("planType")
    .optional()
    .isIn(["installment", "savings", "mortgage", "investment", "rental"])
    .withMessage("Invalid plan type filter"),

  query("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be 'true' or 'false'"),

  query("isPublic")
    .optional()
    .isBoolean()
    .withMessage("isPublic must be 'true' or 'false'"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  handleValidationErrors,
];

// ============================================
// VALIDATOR: Calculate Plan
// ============================================
export const calculatePlanValidator = [
  param("id")
    .notEmpty()
    .withMessage("Plan ID is required")
    .isMongoId()
    .withMessage("Invalid plan ID format"),

  body("amount")
    .notEmpty()
    .withMessage("Amount is required")
    .isInt({ min: 1 })
    .withMessage("Amount must be a positive integer (in kobo)"),

  handleValidationErrors,
];

// ============================================
// VALIDATOR: Find Plans For Amount
// ============================================
export const findPlansForAmountValidator = [
  query("amount")
    .notEmpty()
    .withMessage("Amount parameter is required")
    .isInt({ min: 1 })
    .withMessage("Amount must be a positive integer (in kobo)"),

  query("planType")
    .optional()
    .isIn(["installment", "savings", "mortgage", "investment", "rental"])
    .withMessage("Invalid plan type filter"),

  handleValidationErrors,
];
