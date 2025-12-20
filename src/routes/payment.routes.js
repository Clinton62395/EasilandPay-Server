import express from "express";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";
import paymentController from "../controllers/payment.controller.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Gestion des paiements et retraits
 */

/**
 * @swagger
 * /payments/webhook:
 *   post:
 *     summary: Webhook Flutterwave
 *     description: Route publique appelée par Flutterwave pour notifier les événements de paiement ou transfert.
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook traité avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.post(
  "/webhook",
  express.json({ type: "application/json" }),
  paymentController.handleWebhook
);

/**
 * @swagger
 * /payments/initialize:
 *   post:
 *     summary: Initialiser un paiement (Top-up wallet)
 *     description: Crée une transaction et retourne le lien de paiement Flutterwave
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amountInNaira
 *               - email
 *               - userId
 *             properties:
 *               amountInNaira:
 *                 type: number
 *                 example: 1000
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               userId:
 *                 type: string
 *                 example: 64a1f2c9e4b0f1a23b45c678
 *     responses:
 *       200:
 *         description: Paiement initialisé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     paymentLink:
 *                       type: string
 *                     reference:
 *                       type: string
 *                     transactionId:
 *                       type: string
 */
router.post(
  "/initialize",
  authenticate,
  authorize(["buyer", "admin"]),
  paymentController.initializePayment
);

/**
 * @swagger
 * /payments/verify/{reference}:
 *   get:
 *     summary: Vérifier le statut d’une transaction
 *     description: Vérifie si une transaction a réussi ou échoué
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         description: Référence unique de la transaction
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Statut de la transaction
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 transaction:
 *                   type: object
 *       404:
 *         description: Transaction non trouvée
 *       400:
 *         description: Référence invalide
 */
router.get("/verify/:reference", authenticate, paymentController.verifyPayment);

/**
 * @swagger
 * /payments/withdraw:
 *   post:
 *     summary: Initier un retrait vers un compte bancaire
 *     description: Crée une transaction de type DEBIT et initie un transfert via Flutterwave
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amountInNaira
 *               - account_bank
 *               - account_number
 *             properties:
 *               amountInNaira:
 *                 type: number
 *                 example: 5000
 *               account_bank:
 *                 type: string
 *                 example: "044"
 *               account_number:
 *                 type: string
 *                 example: "0123456789"
 *               beneficiary_name:
 *                 type: string
 *                 example: "John Doe"
 *     responses:
 *       200:
 *         description: Retrait initié avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Paramètres invalides ou transfert échoué
 *       403:
 *         description: Accès refusé
 *       500:
 *         description: Erreur serveur
 */
router.post(
  "/withdraw",
  authenticate,
  authorize(["buyer", "realtor", "admin"]),
  paymentController.initiateWithdrawal
);

export default router;
