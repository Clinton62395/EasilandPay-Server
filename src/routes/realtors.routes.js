import express from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import { userIdParamValidation } from "../validations/auth.validators.js";
import AuthController from "../controllers/user.controller.js";

import validate from "../validations/validatorResult.js";

const router = express.Router();
// ============================================
// REALTOR ROUTES
// ============================================
/**
 * @swagger
 * /auth/realtor/{id}/bank-details:
 *   put:
 *     summary: Update Realtor bank details
 *     tags: [Realtor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Realtor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bankName
 *               - accountNumber
 *               - accountHolder
 *             properties:
 *               bankName:
 *                 type: string
 *               accountNumber:
 *                 type: string
 *               accountHolder:
 *                 type: string
 *               iban:
 *                 type: string
 *               bic:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bank details updated
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Realtor not found
 */

// Update Bank Details
router.put(
  "/:id/bank-details",
  authenticate,
  authorize("realtor", "admin"),
  userIdParamValidation,
  validate,
  AuthController.updateRealtorBankDetails
);

export default router;
