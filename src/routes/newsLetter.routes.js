import express from "express";
import newsletterController from "../controllers/newsLetter.controller.js";
import {
  confirmValidation,
  unsubscribeValidation,
  validateNewsletter,
} from "../validations/newsLetter.validator.js";
import validate from "../validations/validatorResult.js";

const router = express.Router();

// POST subscribe
router.post(
  "/subscribe",
  validateNewsletter,
  validate,
  newsletterController.subscribe
);

// GET confirm
router.get(
  "/confirm/:token",
  confirmValidation,
  validate,
  newsletterController.confirm
);

// GET unsubscribe
router.get(
  "/unsubscribe/:token",
  unsubscribeValidation,
  validate,
  newsletterController.unsubscribe
);

export default router;
