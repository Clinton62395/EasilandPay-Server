import express from "express";
import AuthController from "../controllers/user.controller.js";
import { authenticate, authorize } from "../middlewares/auth.middleware.js";

import {
  loginValidator,
  registerValidator,
  userParamValidation,
  refreshTokenValidation,
  forgotPasswordValidation,
  changePasswordValidation,
  roleParamValidation,
  tokenParamValidation,
  getUsersQueryValidation,
  resetPasswordValidator,
  updateProfileValidation,
} from "../validations/auth.validators.js";
import validate from "../validations/validatorResult.js";
import { verifyFirebaseToken } from "../middlewares/verifyGoogleToken.middleware.js";

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
 * /auth/register:
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
 *               - fullName
 *               - email
 *               - password
 *               - role
 *               - phoneNumber
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: "Billy Doumbouya"
 *               email:
 *                 type: string
 *                 example: "billy@example.com"
 *               password:
 *                 type: string
 *                 example: "Password123!"
 *               role:
 *                 type: string
 *                 example: "buyer"
 *               phoneNumber:
 *                 type: string
 *                 example: "0705674557"
 *     responses:
 *       201:
 *         description: Utilisateur créé
 */

// Register
router.post("/register", registerValidator, validate, AuthController.register);
/**
 * @swagger
 * /auth/login:
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
 *                 example: "admin@gmail.com"
 *               password:
 *                 type: string
 *                 example: "password1234"
 *     responses:
 *       200:
 *         description: Connexion réussie, token renvoyé
 *       401:
 *         description: Identifiants incorrects
 */

// Login
router.post(
  "/login",
  (req, res, next) => {
    console.log("Route /login hit");
    next();
  },
  loginValidator,
  validate,
  AuthController.login
);

/**
 * @swagger
 * /auth/refresh-token:
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
router.post("/refresh-token", AuthController.refreshToken);

/**
 * @swagger
 * /auth/forgot-password:
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
router.post(
  "/forgot-password",
  forgotPasswordValidation,
  validate,
  AuthController.forgotPassword
);

router.post(
  "/verify-otp",

  AuthController.verifyOtpController
);

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
router.post(
  "/reset-password",
  resetPasswordValidator,
  validate,
  AuthController.resetPasswordController
);
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
router.get(
  "/verify-email/:token",
  tokenParamValidation,
  validate,
  AuthController.verifyEmail
);

// ============================================
// PROTECTED ROUTES
// ============================================

/**
 * @swagger
 * /auth/logout:
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
 * /auth/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a user by their MongoDB ObjectId.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: MongoDB User ID
 *         schema:
 *           type: string
 *           example: 675a7fe9e8d129c13b102488
 *     responses:
 *       200:
 *         description: User found successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 675a7fe9e8d129c13b102488
 *                     name:
 *                       type: string
 *                       example: Billy Doumbouya
 *                     email:
 *                       type: string
 *                       example: billy@example.com
 *                     role:
 *                       type: string
 *                       example: user
 *
 *       400:
 *         description: Invalid user ID format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Invalid user ID
 *
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: User not found
 */

// Get Current User
router.get("/me", authenticate, AuthController.getCurrentUser);

/**
 * @swagger
 * /auth/profile:
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
router.put(
  "/profile",
  authenticate,
  updateProfileValidation,
  validate,
  AuthController.updateProfile
);

/**
 * @swagger
 * /auth/change-password:
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
router.post(
  "/change-password",
  authenticate,
  changePasswordValidation,
  validate,
  AuthController.changePassword
);

/**
 * @swagger
 * /auth/send-verification-email:
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
// ADMIN & STAFF ROUTES
// ============================================

/**
 * @swagger
 * /auth/users/:
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
  authorize("admin"),
  getUsersQueryValidation,
  validate,
  AuthController.getAllUsers
);

/**
 * @swagger
 * /auth/role/{role}:
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
  "/role/:role",
  authenticate,
  authorize("admin"),
  roleParamValidation,
  getUsersQueryValidation,
  validate,
  AuthController.getUsersByRole
);
/**
 * @swagger
 * /auth/{id}:
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
 */
router.get(
  "/:id",
  authenticate,
  authorize("admin"),
  userParamValidation,
  validate,
  AuthController.getUserById
);

/**
 * @swagger
 * /auth/statistics:
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
 * /auth/{id}/suspend:
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
  "/:id/suspend",
  authenticate,
  authorize("admin"),
  userParamValidation,
  validate,
  AuthController.suspendUser
);

/**
 * @swagger
 * /auth/{id}/activate:
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
  "/:id/activate",
  authenticate,
  authorize("admin"),
  userParamValidation,
  validate,
  AuthController.activateUser
);

/**
 * @swagger
 * /auth/{id}:
 *   delete:
 *     summary: Supprime un utilisateur (suppression logique ou physique)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
  "/:id",
  authenticate,
  authorize("admin"),
  userParamValidation,
  validate,
  AuthController.deleteUser
);

export default router;
