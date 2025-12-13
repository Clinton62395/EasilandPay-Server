// routes/wallet.routes.js

import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import {
  deposit,
  getWallet,
  moveToEscrow,
  releaseEscrow,
  withdraw,
} from "../controllers/wallet.controller.js";

const router = express.Router();

// =========================
// WALLET ROUTES
// =========================

/**
 * @swagger
 * tags:
 *   - name: Wallet
 *     description: Gestion des portefeuilles utilisateurs
 */

/**
 * @swagger
 * /wallet:
 *   get:
 *     summary: Récupère le portefeuille de l'utilisateur connecté
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Portefeuille récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     balance:
 *                       type: number
 *                       example: 5000
 *                     escrowBalance:
 *                       type: number
 *                       example: 2000
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Wallet non trouvé
 */

// Get user wallet
router.get("/", authenticate, getWallet);

/**
 * @swagger
 * /wallet/deposit:
 *   post:
 *     summary: Créditer le portefeuille de l'utilisateur
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - reference
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Montant à créditer
 *                 example: 10000
 *               reference:
 *                 type: string
 *                 description: Référence de la transaction
 *                 example: "TRX123456"
 *     responses:
 *       200:
 *         description: Portefeuille crédité avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     balance: { type: number, example: 15000 }
 *                     escrowBalance: { type: number, example: 2000 }
 *       400:
 *         description: Solde ou données invalides
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

router.post("/deposit", authenticate, deposit);

/**
 * @swagger
 * /wallet/escrow/move:
 *   post:
 *     summary: Déplacer des fonds vers l'escrow pour une propriété
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - propertyId
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Montant à déplacer vers l'escrow
 *                 example: 5000
 *               propertyId:
 *                 type: string
 *                 description: ID de la propriété liée à l'escrow
 *                 example: "640a1b2c3d4e5f67890abcde"
 *     responses:
 *       200:
 *         description: Fonds déplacés vers l'escrow avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     balance: { type: number, example: 10000 }
 *                     escrowBalance: { type: number, example: 7000 }
 *       400:
 *         description: Solde insuffisant
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

router.post("/escrow/move", authenticate, moveToEscrow);

/**
 * @swagger
 * /wallet/escrow/release:
 *   post:
 *     summary: Libérer les fonds de l'escrow vers le vendeur/realtor
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - propertyId
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Montant à libérer
 *                 example: 5000
 *               propertyId:
 *                 type: string
 *                 description: ID de la propriété concernée
 *                 example: "640a1b2c3d4e5f67890abcde"
 *     responses:
 *       200:
 *         description: Fonds libérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     balance: { type: number, example: 10000 }
 *                     escrowBalance: { type: number, example: 2000 }
 *       400:
 *         description: Erreur lors de la libération
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

router.post("/escrow/release", authenticate, releaseEscrow);

/**
 * @swagger
 * /wallet/withdraw:
 *   post:
 *     summary: Retirer de l'argent du portefeuille
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Montant à retirer
 *                 example: 5000
 *               destinationAccount:
 *                 type: string
 *                 description: Compte destinataire (optionnel)
 *                 example: "1234567890"
 *     responses:
 *       200:
 *         description: Retrait effectué avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     balance: { type: number, example: 5000 }
 *                     escrowBalance: { type: number, example: 2000 }
 *       400:
 *         description: Solde insuffisant
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */

router.post("/withdraw", authenticate, withdraw);

export default router;
