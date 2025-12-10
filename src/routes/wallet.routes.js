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

// Get user wallet
router.get("/", authenticate, getWallet);

// Deposit (Top up)
router.post("/deposit", authenticate, deposit);

// Move funds to escrow
router.post("/escrow/move", authenticate, moveToEscrow);

// Release escrow to seller/realtor
router.post("/escrow/release", authenticate, releaseEscrow);

// Withdraw money
router.post("/withdraw", authenticate, withdraw);

export default router;
