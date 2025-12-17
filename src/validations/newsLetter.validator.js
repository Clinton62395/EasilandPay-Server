import { body, validationResult, param } from "express-validator";

export const validateNewsletter = [
  body("email").isEmail().withMessage("Please provide a valid email"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
  },
];


export const confirmValidation = [
  body("token")
    .notEmpty().withMessage("Token is required")
    .isString().withMessage("Token must be a string"),
];

export const unsubscribeValidation = [
  param("token")
    .notEmpty().withMessage("Token is required")
    .isString().withMessage("Token must be a string"),
  body("email")
    .optional()
    .isEmail()
    .withMessage("Please provide a valid email address"),
];

