import { body, param, query, validationResult } from "express-validator";
import User from "../models/Auth.models.js";
import Property from "../models/Property.models.js";
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
// VALIDATOR: Create Escrow
// ============================================
export const createEscrowValidator = [
  // Property ID validation
  body("propertyId")
    .notEmpty()
    .withMessage("Property ID is required")
    .isMongoId()
    .withMessage("Invalid property ID format")
    .custom(async (value) => {
      const property = await Property.findById(value);
      if (!property) {
        throw new Error("Property not found");
      }
      return true;
    }),

  // Buyer ID validation
  body("buyerId")
    .notEmpty()
    .withMessage("Buyer ID is required")
    .isMongoId()
    .withMessage("Invalid buyer ID format")
    .custom(async (value) => {
      const buyer = await User.findById(value);
      if (!buyer) {
        throw new Error("Buyer not found");
      }
      if (buyer.role !== "buyer") {
        throw new Error("User is not a buyer");
      }
      if (!buyer.isActive) {
        throw new Error("Buyer account is not active");
      }
      return true;
    }),

  // Realtor ID validation (optional)
  body("realtorId")
    .optional()
    .isMongoId()
    .withMessage("Invalid realtor ID format")
    .custom(async (value) => {
      if (value) {
        const realtor = await User.findById(value);
        if (!realtor) {
          throw new Error("Realtor not found");
        }
        if (realtor.role !== "realtor") {
          throw new Error("User is not a realtor");
        }
        if (!realtor.isActive) {
          throw new Error("Realtor account is not active");
        }
      }
      return true;
    }),

  // Total amount validation
  body("totalAmountInKobo")
    .notEmpty()
    .withMessage("Total amount is required")
    .isInt({ min: 100 })
    .withMessage("Total amount must be at least 100 kobo (1 NGN)")
    .custom((value) => {
      if (value > 100000000000) {
        // 1 billion Naira in kobo
        throw new Error(
          "Total amount exceeds maximum allowed (1,000,000,000 NGN)"
        );
      }
      return true;
    }),

  // Payment plan type validation
  body("paymentPlan.type")
    .notEmpty()
    .withMessage("Payment plan type is required")
    .isIn(["weekly", "monthly", "quarterly", "bi-annual", "yearly", "outright"])
    .withMessage("Invalid payment plan type"),

  // Installments validation
  body("paymentPlan.installments")
    .optional()
    .isArray()
    .withMessage("Installments must be an array"),

  body("paymentPlan.installments.*.dueDate")
    .optional()
    .isISO8601()
    .withMessage("Due date must be a valid date"),

  body("paymentPlan.installments.*.amountInKobo")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Installment amount must be a positive integer"),

  // Commission percentage validation (optional)
  body("commission.percentage")
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage("Commission percentage must be between 0 and 100"),

  handleValidationErrors,
];

// ============================================
// VALIDATOR: Update Escrow
// ============================================
export const updateEscrowValidator = [
  param("id")
    .notEmpty()
    .withMessage("Escrow ID is required")
    .isMongoId()
    .withMessage("Invalid escrow ID format"),

  // Status validation (optional)
  body("status")
    .optional()
    .isIn([
      "CREATED",
      "ACTIVE",
      "COMPLETED",
      "DISPUTED",
      "CANCELLED",
      "REFUNDED",
    ])
    .withMessage("Invalid escrow status"),

  // Prevent direct modification of critical fields
  body("totalAmountInKobo")
    .not()
    .exists()
    .withMessage("Cannot update total amount after creation"),

  body("buyerId")
    .not()
    .exists()
    .withMessage("Cannot update buyer after creation"),

  body("propertyId")
    .not()
    .exists()
    .withMessage("Cannot update property after creation"),

  handleValidationErrors,
];

// ============================================
// VALIDATOR: Get Escrow By ID
// ============================================
export const getEscrowByIdValidator = [
  param("id")
    .notEmpty()
    .withMessage("Escrow ID is required")
    .isMongoId()
    .withMessage("Invalid escrow ID format"),

  handleValidationErrors,
];

// ============================================
// VALIDATOR: Get All Escrows
// ============================================
export const getAllEscrowsValidator = [
  query("buyerId")
    .optional()
    .isMongoId()
    .withMessage("Invalid buyer ID format"),

  query("propertyId")
    .optional()
    .isMongoId()
    .withMessage("Invalid property ID format"),

  query("realtorId")
    .optional()
    .isMongoId()
    .withMessage("Invalid realtor ID format"),

  query("status")
    .optional()
    .isIn([
      "CREATED",
      "ACTIVE",
      "COMPLETED",
      "DISPUTED",
      "CANCELLED",
      "REFUNDED",
    ])
    .withMessage("Invalid status filter"),

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
// VALIDATOR: Record Payment
// ============================================
export const recordPaymentValidator = [
  param("id")
    .notEmpty()
    .withMessage("Escrow ID is required")
    .isMongoId()
    .withMessage("Invalid escrow ID format"),

  body("amountInKobo")
    .notEmpty()
    .withMessage("Payment amount is required")
    .isInt({ min: 100 })
    .withMessage("Payment amount must be at least 100 kobo (1 NGN)"),

  body("transactionId")
    .notEmpty()
    .withMessage("Transaction ID is required")
    .isMongoId()
    .withMessage("Invalid transaction ID format"),

  body("installmentIndex")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Installment index must be a non-negative integer"),

  handleValidationErrors,
];

// ============================================
// VALIDATOR: Initiate Dispute
// ============================================
export const initiateDisputeValidator = [
  param("id")
    .notEmpty()
    .withMessage("Escrow ID is required")
    .isMongoId()
    .withMessage("Invalid escrow ID format"),

  body("user")
    .notEmpty()
    .withMessage("User is required")
    .isMongoId()
    .withMessage("Invalid user ID format")
    .custom(async (value) => {
      const user = await User.findById(value);
      if (!user) {
        throw new Error("User not found");
      }
      return true;
    }),

  body("reason")
    .notEmpty()
    .withMessage("Dispute reason is required")
    .isLength({ min: 20, max: 1000 })
    .withMessage("Dispute reason must be between 20 and 1000 characters"),

  handleValidationErrors,
];

// ============================================
// VALIDATOR: Resolve Dispute
// ============================================
export const resolveDisputeValidator = [
  param("id")
    .notEmpty()
    .withMessage("Escrow ID is required")
    .isMongoId()
    .withMessage("Invalid escrow ID format"),

  body("adminId")
    .notEmpty()
    .withMessage("Admin ID is required")
    .isMongoId()
    .withMessage("Invalid admin ID format")
    .custom(async (value) => {
      const admin = await User.findById(value);
      if (!admin) {
        throw new Error("Admin not found");
      }
      if (admin.role !== "admin" && admin.role !== "staff") {
        throw new Error("Only admin or staff can resolve disputes");
      }
      return true;
    }),

  body("resolution")
    .notEmpty()
    .withMessage("Resolution description is required")
    .isLength({ min: 20, max: 1000 })
    .withMessage("Resolution must be between 20 and 1000 characters"),

  body("newStatus")
    .notEmpty()
    .withMessage("New status is required")
    .isIn(["ACTIVE", "COMPLETED", "CANCELLED", "REFUNDED"])
    .withMessage("Invalid resolution status"),

  handleValidationErrors,
];

// ============================================
// VALIDATOR: Release Funds
// ============================================
export const releaseFundsValidator = [
  param("id")
    .notEmpty()
    .withMessage("Escrow ID is required")
    .isMongoId()
    .withMessage("Invalid escrow ID format"),

  body("amountInKobo")
    .notEmpty()
    .withMessage("Release amount is required")
    .isInt({ min: 100 })
    .withMessage("Release amount must be at least 100 kobo (1 NGN)"),

  body("reason")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Reason cannot exceed 500 characters"),

  handleValidationErrors,
];

// ============================================
// VALIDATOR: Cancel Escrow
// ============================================
export const cancelEscrowValidator = [
  param("id")
    .notEmpty()
    .withMessage("Escrow ID is required")
    .isMongoId()
    .withMessage("Invalid escrow ID format"),

  body("reason")
    .notEmpty()
    .withMessage("Cancellation reason is required")
    .isLength({ min: 10, max: 500 })
    .withMessage("Reason must be between 10 and 500 characters"),

  handleValidationErrors,
];

// ============================================
// VALIDATOR: Complete Milestone
// ============================================
export const completeMilestoneValidator = [
  param("id")
    .notEmpty()
    .withMessage("Escrow ID is required")
    .isMongoId()
    .withMessage("Invalid escrow ID format"),

  param("milestoneIndex")
    .notEmpty()
    .withMessage("Milestone index is required")
    .isInt({ min: 0 })
    .withMessage("Milestone index must be a non-negative integer"),

  handleValidationErrors,
];
