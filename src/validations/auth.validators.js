import { body, param, query } from "express-validator";

// Register validation
export const registerValidator = [
  // Full name
  body("fullName").notEmpty().withMessage("Full name required"),

  // Email
  body("email").isEmail().withMessage("Invalid email"),

  // Password
  body("password").isLength({ min: 6 }).withMessage("Password too short"),

  // Confirm Password
  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Passwords do not match");
    }
    return true;
  }),

  // Role
  body("role")
    .isIn(["buyer", "realtor", "company"])
    .withMessage("Invalid role"),

  // Terms & Conditions
  body("termsCondition")
    .equals("true")
    .withMessage("You must accept terms and conditions"),
];

// Login validation
export const loginValidator = [
  body("email").isEmail().withMessage("Invalid email"),
  body("password").notEmpty().withMessage("Password required"),
];

export const refreshTokenValidation = [
  body("refreshToken")
    .trim()
    .notEmpty()
    .withMessage("Refresh token is required"),
];

// ============================================
// FORGOT PASSWORD VALIDATION
// ============================================
export const forgotPasswordValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Please provide a valid email address")
    .normalizeEmail()
    .notEmpty()
    .withMessage("Email is required"),
];

// ============================================
// RESET PASSWORD VALIDATION
// ============================================

export const resetPasswordValidator = [
  body("token")
    .notEmpty()
    .withMessage("Reset token is required")
    .isLength({ min: 20 }) // adapter selon ton token
    .withMessage("Invalid reset token"),

  body("newPassword")
    .notEmpty()
    .withMessage("New password is required")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long"),
];
// ============================================
// CHANGE PASSWORD VALIDATION
// ============================================
export const changePasswordValidation = [
  body("currentPassword")
    .trim()
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/
    )
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
    )
    .notEmpty()
    .withMessage("New password is required")
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error("New password must be different from current password");
      }
      return true;
    }),
];

// ============================================
// UPDATE PROFILE VALIDATION
// ============================================
export const updateProfileValidation = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),

  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),

  body("phoneNumber")
    .optional()
    .trim()
    .matches(/^[\d\s\+\-\(\)]+$/)
    .withMessage("Please provide a valid phone number")
    .isLength({ min: 10, max: 20 })
    .withMessage("Phone number must be between 10 and 20 characters"),

  body("profilePicture")
    .optional()
    .trim()
    .isURL()
    .withMessage("Please provide a valid profile picture URL"),

  body("address")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Address cannot exceed 500 characters"),

  body("city")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("City cannot exceed 100 characters"),

  body("state")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("State cannot exceed 100 characters"),

  body("country")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Country cannot exceed 100 characters"),

  body("companyInfo.companyName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage("Company name must be between 2 and 200 characters"),

  body("companyInfo.registrationNumber")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Registration number cannot exceed 100 characters"),

  body("companyInfo.taxId")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Tax ID cannot exceed 100 characters"),

  body("companyInfo.address")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Company address cannot exceed 500 characters"),

  body("companyInfo.website")
    .optional()
    .trim()
    .isURL()
    .withMessage("Please provide a valid website URL"),

  body("realtorInfo.licenseNumber")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("License number cannot exceed 100 characters"),

  body("realtorInfo.yearsOfExperience")
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage("Years of experience must be between 0 and 100"),

  body("realtorInfo.specialization")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("Specialization cannot exceed 200 characters"),
];

// ============================================
// UPDATE BANK DETAILS VALIDATION
// ============================================
export const updateBankDetailsValidation = [
  body("accountNumber")
    .trim()
    .notEmpty()
    .withMessage("Account number is required")
    .matches(/^\d+$/)
    .withMessage("Account number must contain only digits")
    .isLength({ min: 10, max: 10 })
    .withMessage("Account number must be 10 digits"),

  body("bankCode").trim().notEmpty().withMessage("Bank code is required"),

  body("bankName").trim().notEmpty().withMessage("Bank name is required"),

  body("accountName").trim().notEmpty().withMessage("Account name is required"),
];

// ============================================
// PARAM VALIDATION (for routes with :id)
// ============================================
export const userIdParamValidation = [
  param("id")
    .trim()
    .notEmpty()
    .withMessage("User ID is required")
    .isMongoId()
    .withMessage("Invalid user ID format"),
];

export const roleParamValidation = [
  param("role")
    .trim()
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["buyer", "realtor", "company", "staff", "admin"])
    .withMessage("Invalid role"),
];

export const tokenParamValidation = [
  param("token").trim().notEmpty().withMessage("Token is required"),
];

// ============================================
// QUERY VALIDATION (for getAllUsers)
// ============================================
export const getUsersQueryValidation = [
  query("role")
    .optional()
    .trim()
    .isIn(["buyer", "realtor", "company", "staff", "admin"])
    .withMessage("Invalid role"),

  query("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean value"),

  query("search")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Search query must be between 1 and 100 characters"),

  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100")
    .toInt(),
];
