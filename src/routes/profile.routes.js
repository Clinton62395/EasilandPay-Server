// routes/profile.js
import express from "express";
import multer from "multer";
import {
  createProfile,
  getProfile,
  updateProfileStatus,
  validateProfileData,
} from "../controllers/profileController.js";
import { requireAuth } from "../middleware/auth.js";
import {
  requireActiveProfile,
  canCreateProperty,
  canInvest,
} from "../middleware/profileValidation.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

// Validation des données
router.post("/validate", requireAuth, validateProfileData);

// Création/soumission du profil
router.post(
  "/submit",
  requireAuth,
  upload.fields([
    { name: "identityDocument", maxCount: 1 },
    { name: "experienceDocument", maxCount: 1 },
    { name: "licenseDocument", maxCount: 1 },
    { name: "registrationDocument", maxCount: 1 },
    { name: "taxDocument", maxCount: 1 },
    { name: "insuranceDocument", maxCount: 1 },
  ]),
  createProfile
);

// Récupération du profil
router.get("/", requireAuth, getProfile);

// Mise à jour du statut (admin seulement)
router.patch("/:id/status", requireAuth, updateProfileStatus);

// Routes protégées par statut de profil
router.post("/properties", requireAuth, canCreateProperty, (req, res) => {
  // Logique de création de propriété
  res.json({ success: true, message: "Propriété créée" });
});

router.post("/invest", requireAuth, canInvest, (req, res) => {
  // Logique d'investissement
  res.json({ success: true, message: "Investissement effectué" });
});

export default router;
