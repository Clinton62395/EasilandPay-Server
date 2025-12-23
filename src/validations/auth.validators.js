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

// ============================================
// UPDATE BANK DETAILS VALIDATION
// ============================================
export const updateProfileValidation = [
  // Informations personnelles
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("Le prénom est requis")
    .isLength({ min: 2, max: 50 })
    .withMessage("Le prénom doit contenir entre 2 et 50 caractères")
    .matches(/^[a-zA-ZÀ-ÿ\s\-']+$/)
    .withMessage("Le prénom ne doit contenir que des lettres"),

  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("Le nom est requis")
    .isLength({ min: 2, max: 50 })
    .withMessage("Le nom doit contenir entre 2 et 50 caractères")
    .matches(/^[a-zA-ZÀ-ÿ\s\-']+$/)
    .withMessage("Le nom ne doit contenir que des lettres"),

  // Téléphone
  body("phoneNumber")
    .trim()
    .notEmpty()
    .withMessage("Le numéro de téléphone est requis")
    .matches(/^[0-9+\s()-]+$/)
    .withMessage("Format de téléphone invalide")
    .isLength({ min: 10 })
    .withMessage("Le numéro de téléphone doit contenir au moins 10 caractères"),

  // Adresse (optionnel)
  body("address")
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage("L'adresse ne peut pas dépasser 200 caractères"),

  body("city")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("La ville ne peut pas dépasser 100 caractères"),

  body("country")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Le pays ne peut pas dépasser 100 caractères"),

  // Validation conditionnelle pour les mots de passe
  body().custom((value, { req }) => {
    // Si un nouveau mot de passe est fourni, vérifier le mot de passe actuel
    if (req.body.newPassword && req.body.newPassword.trim() !== "") {
      if (!req.body.currentPassword || req.body.currentPassword.trim() === "") {
        throw new Error(
          "Le mot de passe actuel est requis pour changer le mot de passe"
        );
      }
    }
    return true;
  }),

  // Nouveau mot de passe (optionnel mais avec validation si fourni)
  body("newPassword")
    .optional()
    .trim()
    .isLength({ min: 8 })
    .withMessage("Le nouveau mot de passe doit contenir au moins 8 caractères")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage(
      "Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial"
    ),

  // Confirmation du mot de passe (conditionnel)
  body("confirmPassword")
    .optional()
    .trim()
    .custom((value, { req }) => {
      if (req.body.newPassword && req.body.newPassword.trim() !== "") {
        if (!value || value.trim() === "") {
          throw new Error("La confirmation du mot de passe est requise");
        }
        if (value !== req.body.newPassword) {
          throw new Error("Les mots de passe ne correspondent pas");
        }
      }
      return true;
    }),
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
