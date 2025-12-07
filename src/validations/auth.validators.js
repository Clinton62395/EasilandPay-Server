import { body } from "express-validator";

// Register validation
export const registerValidator = [
  body("firstName").notEmpty().withMessage("First name required"),
  body("lastName").notEmpty().withMessage("Last name required"),
  body("email").isEmail().withMessage("Invalid email"),
  body("password").isLength({ min: 6 }).withMessage("Password too short"),
  body("role")
    .isIn(["buyer", "realtor", "company", "staff", "admin"])
    .withMessage("Invalid role"),
];

// Login validation
export const loginValidator = [
  body("email").isEmail().withMessage("Invalid email"),
  body("password").notEmpty().withMessage("Password required"),
];
