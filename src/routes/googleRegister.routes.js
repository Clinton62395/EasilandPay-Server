import express from "express";
import AuthGoogleController from "../controllers/googleRegister.controller.js";

// routes/user.routes.js
const router = express.Router();

// Google OAuth
router.post("/google-register", AuthGoogleController.googleRegister);
router.get("/check-profile", AuthGoogleController.googleCheck);

export default router;
