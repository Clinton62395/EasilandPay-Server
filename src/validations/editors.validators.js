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
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  
  next();
};

// ============================================
// VALIDATOR: Create Editor Content
// ============================================
export const createEditorValidator = [
  // Author ID validation
  body("AuthorId")
    .notEmpty()
    .withMessage("Author ID is required")
    .isMongoId()
    .withMessage("Invalid author ID format")
    .custom(async (value) => {
      const author = await User.findById(value);
      if (!author) {
        throw new Error("Author not found");
      }
      if (!author.isActive) {
        throw new Error("Author account is not active");
      }
      return true;
    }),

  // Title validation
  body("title")
    .notEmpty()
    .withMessage("Title is required")
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Title must be between 5 and 200 characters")
    .matches(/^[a-zA-Z0-9\s\-.,!?'":()]+$/)
    .withMessage("Title contains invalid characters"),

  // Content validation
  body("content")
    .notEmpty()
    .withMessage("Content is required")
    .trim()
    .isLength({ min: 50, max: 50000 })
    .withMessage("Content must be between 50 and 50,000 characters"),

  // Payment methods validation (optional)
  body("paymentMethod")
    .optional()
    .isArray()
    .withMessage("Payment method must be an array")
    .custom((value) => {
      const validMethods = ["card", "bank_transfer", "paystack", "wallet", "cash"];
      const invalidMethods = value.filter(method => !validMethods.includes(method));
      if (invalidMethods.length > 0) {
        throw new Error(`Invalid payment methods: ${invalidMethods.join(", ")}`);
      }
      return true;
    }),

  handleValidationErrors,
];

// ============================================
// VALIDATOR: Update Editor Content
// ============================================
export const updateEditorValidator = [
  // ID parameter validation
  param("id")
    .notEmpty()
    .withMessage("Editor content ID is required")
    .isMongoId()
    .withMessage("Invalid editor content ID format"),

  // Author ID validation (optional for update)
  body("AuthorId")
    .optional()
    .isMongoId()
    .withMessage("Invalid author ID format")
    .custom(async (value) => {
      const author = await User.findById(value);
      if (!author) {
        throw new Error("Author not found");
      }
      return true;
    }),

  // Title validation (optional)
  body("title")
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Title must be between 5 and 200 characters")
    .matches(/^[a-zA-Z0-9\s\-.,!?'":()]+$/)
    .withMessage("Title contains invalid characters"),

  // Content validation (optional)
  body("content")
    .optional()
    .trim()
    .isLength({ min: 50, max: 50000 })
    .withMessage("Content must be between 50 and 50,000 characters"),

  // Payment methods validation (optional)
  body("paymentMethod")
    .optional()
    .isArray()
    .withMessage("Payment method must be an array")
    .custom((value) => {
      const validMethods = ["card", "bank_transfer", "paystack", "wallet", "cash"];
      const invalidMethods = value.filter(method => !validMethods.includes(method));
      if (invalidMethods.length > 0) {
        throw new Error(`Invalid payment methods: ${invalidMethods.join(", ")}`);
      }
      return true;
    }),

  handleValidationErrors,
];

// ============================================
// VALIDATOR: Get Editor Content By ID
// ============================================
export const getEditorByIdValidator = [
  param("id")
    .notEmpty()
    .withMessage("Editor content ID is required")
    .isMongoId()
    .withMessage("Invalid editor content ID format"),

  handleValidationErrors,
];

// ============================================
// VALIDATOR: Delete Editor Content
// ============================================
export const deleteEditorValidator = [
  param("id")
    .notEmpty()
    .withMessage("Editor content ID is required")
    .isMongoId()
    .withMessage("Invalid editor content ID format"),

  handleValidationErrors,
];

// ============================================
// VALIDATOR: Get Editor Contents By Author
// ============================================
export const getEditorsByAuthorValidator = [
  param("authorId")
    .notEmpty()
    .withMessage("Author ID is required")
    .isMongoId()
    .withMessage("Invalid author ID format")
    .custom(async (value) => {
      const author = await User.findById(value);
      if (!author) {
        throw new Error("Author not found");
      }
      return true;
    }),

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
// VALIDATOR: Get All Editor Contents
// ============================================
export const getAllEditorsValidator = [
  query("authorId")
    .optional()
    .isMongoId()
    .withMessage("Invalid author ID format"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),

  query("search")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Search query must be between 2 and 100 characters"),

  handleValidationErrors,
];

// ============================================
// VALIDATOR: Search Editor Contents
// ============================================
export const searchEditorsValidator = [
  query("query")
    .notEmpty()
    .withMessage("Search query parameter is required")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Search query must be between 2 and 100 characters"),

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