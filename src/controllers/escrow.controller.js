
// =============================================
// CONTROLLERS/USER.CONTROLLER.JS
// Gestion des routes - appelle le service
// =============================================

import userService from "../services/user.service.js";
import { catchAsynch } from "../utils/catchAsynch.utils.js";
import { AppError } from "../utils/appError.utils.js";

// ============================================
// RÉCUPÉRER MON PROFIL
// ============================================
/**
 * @desc    Get current user profile
 * @route   GET /api/users/me
 * @access  Private
 */
export const getMe = catchAsynch(async (req, res, next) => {
  // req.user est ajouté par le middleware d'authentification
  const user = await userService.getUserById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// ============================================
// METTRE À JOUR MON PROFIL
// ============================================
/**
 * @desc    Update current user profile
 * @route   PUT /api/users/me
 * @access  Private
 */
export const updateMe = catchAsynch(async (req, res, next) => {
  // Validations déjà gérées par express-validator
  const updates = req.body;

  // Empêcher la mise à jour de certains champs via cette route
  if (updates.password || updates.email || updates.role) {
    return next(
      new AppError(
        "Please use appropriate endpoints to update email, password or role",
        400
      )
    );
  }

  const user = await userService.updateUserProfile(req.user.id, updates);

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: user,
  });
});

// ============================================
// CHANGER MON MOT DE PASSE
// ============================================
/**
 * @desc    Update user password
 * @route   PUT /api/users/me/password
 * @access  Private
 */
export const updatePassword = catchAsynch(async (req, res, next) => {
  // Validations déjà gérées par express-validator
  const { currentPassword, newPassword } = req.body;

  const result = await userService.updatePassword(
    req.user.id,
    currentPassword,
    newPassword
  );

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

// ============================================
// RÉCUPÉRER UN UTILISATEUR PAR ID (Admin/Staff)
// ============================================
/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Private (Admin/Staff)
 */
export const getUserById = catchAsynch(async (req, res, next) => {
  // Validation de l'ID déjà gérée par express-validator
  const { id } = req.params;

  const user = await userService.getUserById(id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// ============================================
// RÉCUPÉRER TOUS LES UTILISATEURS (Admin/Staff)
// ============================================
/**
 * @desc    Get all users with filters and pagination
 * @route   GET /api/users
 * @query   role, isActive, search, page, limit
 * @access  Private (Admin/Staff)
 */
export const getAllUsers = catchAsynch(async (req, res, next) => {
  // Validations déjà gérées par express-validator
  const { role, isActive, search, page = 1, limit = 20 } = req.query;

  const filters = { role, isActive, search };

  const result = await userService.getAllUsers(filters, page, limit);

  res.status(200).json({
    success: true,
    count: result.users.length,
    pagination: result.pagination,
    data: result.users,
  });
});

// ============================================
// RÉCUPÉRER LES UTILISATEURS PAR RÔLE (Admin/Staff)
// ============================================
/**
 * @desc    Get all users of a specific role
 * @route   GET /api/users/role/:role
 * @access  Private (Admin/Staff)
 */
export const getUsersByRole = catchAsynch(async (req, res, next) => {
  // Validation déjà gérée par express-validator
  const { role } = req.params;

  const users = await userService.getUsersByRole(role);

  res.status(200).json({
    success: true,
    count: users.length,
    data: users,
  });
});

// ============================================
// METTRE À JOUR UN UTILISATEUR (Admin)
// ============================================
/**
 * @desc    Update any user (admin only)
 * @route   PUT /api/users/:id
 * @access  Private (Admin only)
 */
export const updateUser = catchAsynch(async (req, res, next) => {
  // Validations déjà gérées par express-validator
  const { id } = req.params;
  const updates = req.body;

  const user = await userService.updateUserProfile(id, updates);

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: user,
  });
});

// ============================================
// SUSPENDRE UN UTILISATEUR (Admin)
// ============================================
/**
 * @desc    Suspend a user account
 * @route   PATCH /api/users/:id/suspend
 * @access  Private (Admin only)
 */
export const suspendUser = catchAsynch(async (req, res, next) => {
  // Validation déjà gérée par express-validator
  const { id } = req.params;

  // Empêcher l'admin de se suspendre lui-même
  if (id === req.user.id) {
    return next(new AppError("You cannot suspend your own account", 400));
  }

  const user = await userService.suspendUser(id);

  res.status(200).json({
    success: true,
    message: "User suspended successfully",
    data: user,
  });
});

// ============================================
// ACTIVER UN UTILISATEUR (Admin)
// ============================================
/**
 * @desc    Activate a suspended user account
 * @route   PATCH /api/users/:id/activate
 * @access  Private (Admin only)
 */
export const activateUser = catchAsynch(async (req, res, next) => {
  // Validation déjà gérée par express-validator
  const { id } = req.params;

  const user = await userService.activateUser(id);

  res.status(200).json({
    success: true,
    message: "User activated successfully",
    data: user,
  });
});

// ============================================
// SUPPRIMER UN UTILISATEUR (Admin)
// ============================================
/**
 * @desc    Permanently delete a user
 * @route   DELETE /api/users/:id
 * @access  Private (Admin only)
 */
export const deleteUser = catchAsynch(async (req, res, next) => {
  // Validation déjà gérée par express-validator
  const { id } = req.params;

  // Empêcher l'admin de se supprimer lui-même
  if (id === req.user.id) {
    return next(new AppError("You cannot delete your own account", 400));
  }

  const result = await userService.deleteUser(id);

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

// ============================================
// METTRE À JOUR MES INFOS BANCAIRES (Realtor)
// ============================================
/**
 * @desc    Update realtor bank details for withdrawals
 * @route   PUT /api/users/realtor/bank-details
 * @access  Private (Realtor only)
 */
export const updateRealtorBankDetails = catchAsynch(async (req, res, next) => {
  // Validations déjà gérées par express-validator
  const { accountNumber, bankCode, bankName, accountName } = req.body;

  // Vérifier que l'utilisateur connecté est bien un realtor
  if (req.user.role !== "realtor") {
    return next(new AppError("Only realtors can update bank details", 403));
  }

  const bankDetails = { accountNumber, bankCode, bankName, accountName };

  const user = await userService.updateRealtorBankDetails(
    req.user.id,
    bankDetails
  );

  res.status(200).json({
    success: true,
    message: "Bank details updated successfully",
    data: user,
  });
});

// ============================================
// RÉCUPÉRER LES STATISTIQUES (Admin)
// ============================================
/**
 * @desc    Get user statistics and analytics
 * @route   GET /api/users/stats/summary
 * @access  Private (Admin only)
 */
export const getUserStatistics = catchAsynch(async (req, res, next) => {
  const stats = await userService.getUserStatistics();

  res.status(200).json({
    success: true,
    data: stats,
  });
});
