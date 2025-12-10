import express from "express";
import AuthController from "../controllers/user.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

import {
  loginValidator,
  registerValidator,
} from "../validations/auth.validators.js";

const router = express.Router();

// ============================================
// PUBLIC ROUTES
// ============================================
/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Routes publiques et protégées d'authentification
 *   - name: Realtor
 *     description: Routes spécifiques aux Realtors
 *   - name: Admin
 *     description: Routes réservées aux Admin et Staff
 */

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Crée un nouvel utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *       400:
 *         description: Données invalides
 */

// Register
router.post("/register", registerValidator, AuthController.register);
/**
 * @swagger
 * /login:
 *   post:
 *     summary: Connexion d'un utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Connexion réussie, token renvoyé
 *       401:
 *         description: Identifiants incorrects
 */

// Login
router.post("/login", loginValidator, AuthController.login);

/**
 * @swagger
 * /refresh-token:
 *   post:
 *     summary: Rafraîchit le token d'un utilisateur connecté
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nouveau token renvoyé
 *       401:
 *         description: Non authentifié
 */

// Refresh Token
router.post("/refresh-token", authenticate, AuthController.refreshToken);

/**
 * @swagger
 * /forgot-password:
 *   post:
 *     summary: Demande de réinitialisation de mot de passe
 *     tags: [Auth]
 *     description: Envoie un email avec un lien/token de réinitialisation de mot de passe. Accessible sans authentification.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email de l'utilisateur
 *     responses:
 *       200:
 *         description: Email de réinitialisation envoyé avec succès
 *       400:
 *         description: Email invalide ou utilisateur non trouvé
 *       500:
 *         description: Erreur lors de l'envoi de l'email
 */

// Forgot Password
router.post("/forgot-password", AuthController.forgotPassword);

/**
 * @swagger
 * /reset-password:
 *   post:
 *     summary: Réinitialise le mot de passe
 *     tags: [Auth]
 *     description: Réinitialise le mot de passe en utilisant le token reçu par email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token de réinitialisation reçu par email
 *               newPassword:
 *                 type: string
 *                 description: Nouveau mot de passe
 *               confirmPassword:
 *                 type: string
 *                 description: Confirmation du nouveau mot de passe
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé avec succès
 *       400:
 *         description: Token invalide, expiré ou données invalides
 *       500:
 *         description: Erreur lors de la réinitialisation
 */

// Reset Password
router.post("/reset-password", AuthController.resetPassword);
/**
 * @swagger
 * /verify-email/{token}:
 *   get:
 *     summary: Vérifie l'email d'un utilisateur via un token
 *     tags: [Auth]
 *     description: Valide l'email de l'utilisateur en utilisant le token reçu lors de l'inscription ou renvoi.
 *     parameters:
 *       - in: path
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: Token de vérification d'email envoyé par email
 *     responses:
 *       200:
 *         description: Email vérifié avec succès
 *       400:
 *         description: Token invalide ou expiré
 *       404:
 *         description: Utilisateur non trouvé
 */

// Verify Email
router.get("/verify-email/:token", AuthController.verifyEmail);

// ============================================
// PROTECTED ROUTES
// ============================================

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Déconnecte l'utilisateur
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 */
// Logout
router.post("/logout", authenticate, AuthController.logout);

/**
 * @swagger
 * /me:
 *   get:
 *     summary: Récupère les informations de l'utilisateur connecté
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Informations utilisateur récupérées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *                 isVerified:
 *                   type: boolean
 *       401:
 *         description: Non authentifié
 */

// Get Current User
router.get("/me", authenticate, AuthController.getCurrentUser);

/**
 * @swagger
 * /profile:
 *   put:
 *     summary: Met à jour le profil de l'utilisateur connecté
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nom complet de l'utilisateur
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Adresse email (unique)
 *               phone:
 *                 type: string
 *                 description: Numéro de téléphone
 *               avatar:
 *                 type: string
 *                 description: URL de l'avatar ou base64
 *     responses:
 *       200:
 *         description: Profil mis à jour avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 */

// Update Profile
router.put("/profile", authenticate, AuthController.updateProfile);

/**
 * @swagger
 * /change-password:
 *   post:
 *     summary: Change le mot de passe de l'utilisateur connecté
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 description: Ancien mot de passe
 *               newPassword:
 *                 type: string
 *                 description: Nouveau mot de passe
 *               confirmPassword:
 *                 type: string
 *                 description: Confirmation du nouveau mot de passe
 *     responses:
 *       200:
 *         description: Mot de passe changé avec succès
 *       400:
 *         description: Données invalides ou ancien mot de passe incorrect
 *       401:
 *         description: Non authentifié
 */

// Change Password
router.post("/change-password", authenticate, AuthController.changePassword);

/**
 * @swagger
 * /send-verification-email:
 *   post:
 *     summary: Renvoie un email de vérification
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Email de vérification envoyé avec succès
 *       400:
 *         description: Email déjà vérifié
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur lors de l'envoi de l'email
 */

// Send Verification Email
router.post(
  "/send-verification-email",
  authenticate,
  AuthController.sendEmailVerification
);

// ============================================
// REALTOR ROUTES
// ============================================

/**
 * @swagger
 * /realtor/{id}/bank-details:
 *   put:
 *     summary: Met à jour les coordonnées bancaires d'un Realtor
 *     tags: [Realtor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID du Realtor
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
 *                 description: Nom de la banque
 *               accountNumber:
 *                 type: string
 *                 description: Numéro de compte bancaire
 *               accountHolder:
 *                 type: string
 *                 description: Titulaire du compte
 *               iban:
 *                 type: string
 *                 description: IBAN (optionnel)
 *               bic:
 *                 type: string
 *                 description: BIC/SWIFT (optionnel)
 *     responses:
 *       200:
 *         description: Coordonnées bancaires mises à jour avec succès
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (seul le Realtor ou un Admin peut mettre à jour)
 *       404:
 *         description: Realtor non trouvé
 */

// Update Bank Details
router.put(
  "/realtor/:id/bank-details",
  authenticate,
  authorize("realtor", "admin"),
  AuthController.updateRealtorBankDetails
);

// ============================================
// ADMIN & STAFF ROUTES
// ============================================

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Récupère la liste de tous les utilisateurs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page (pagination)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Nombre d'utilisateurs par page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Rechercher par nom ou email
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, suspended, inactive]
 *         description: Filtrer par statut
 *     responses:
 *       200:
 *         description: Liste des utilisateurs récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (Admin ou Staff requis)
 */

// Get All Users
router.get(
  "/users",
  authenticate,
  authorize("admin", "staff"),
  AuthController.getAllUsers
);

/**
 * @swagger
 * /users/role/{role}:
 *   get:
 *     summary: Récupère les utilisateurs par rôle
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, realtor, buyer, staff]
 *         required: true
 *         description: Rôle à filtrer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Nombre d'utilisateurs par page
 *     responses:
 *       200:
 *         description: Utilisateurs du rôle récupérés avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Rôle invalide
 */

// Get Users By Role
router.get(
  "/users/role/:role",
  authenticate,
  authorize("admin", "staff"),
  AuthController.getUsersByRole
);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Récupère les détails d'un utilisateur par ID
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de l'utilisateur
 *     responses:
 *       200:
 *         description: Détails de l'utilisateur récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *                 status:
 *                   type: string
 *                 isVerified:
 *                   type: boolean
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Utilisateur non trouvé
 */

// Get User By ID
router.get(
  "/users/:id",
  authenticate,
  authorize("admin", "staff"),
  AuthController.getUserById
);

/**
 * @swagger
 * /statistics:
 *   get:
 *     summary: Récupère les statistiques des utilisateurs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: integer
 *                 totalAdmins:
 *                   type: integer
 *                 totalRealtors:
 *                   type: integer
 *                 totalBuyers:
 *                   type: integer
 *                 activeUsers:
 *                   type: integer
 *                 suspendedUsers:
 *                   type: integer
 *                 verifiedUsers:
 *                   type: integer
 *                 unverifiedUsers:
 *                   type: integer
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (Admin requis)
 */

// Get Statistics
router.get(
  "/statistics",
  authenticate,
  authorize("admin"),
  AuthController.getUserStatistics
);

/**
 * @swagger
 * /users/{id}/suspend:
 *   patch:
 *     summary: Suspend un utilisateur
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de l'utilisateur à suspendre
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Raison de la suspension
 *     responses:
 *       200:
 *         description: Utilisateur suspendu avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (Admin requis)
 *       404:
 *         description: Utilisateur non trouvé
 */

// Suspend User
router.patch(
  "/users/:id/suspend",
  authenticate,
  authorize("admin"),
  AuthController.suspendUser
);

/**
 * @swagger
 * /users/{id}/activate:
 *   patch:
 *     summary: Active un utilisateur suspendu
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de l'utilisateur à activer
 *     responses:
 *       200:
 *         description: Utilisateur activé avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (Admin requis)
 *       404:
 *         description: Utilisateur non trouvé
 */

// Activate User
router.patch(
  "/users/:id/activate",
  authenticate,
  authorize("admin"),
  AuthController.activateUser
);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Supprime un utilisateur (suppression logique ou physique)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID de l'utilisateur à supprimer
 *     responses:
 *       200:
 *         description: Utilisateur supprimé avec succès
 *       401:
 *         description: Non authentifié
 *       403:
 *         description: Accès refusé (Admin requis)
 *       404:
 *         description: Utilisateur non trouvé
 */

// Delete User
router.delete(
  "/users/:id",
  authenticate,
  authorize("admin"),
  AuthController.deleteUser
);

export default router;
