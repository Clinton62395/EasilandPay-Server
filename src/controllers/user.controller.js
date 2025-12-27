import { token } from "morgan";
import userService from "../services/user.service.js";
import { AppError } from "../utils/appError.utils.js";
import { catchAsynch } from "../utils/catchAsynch.utils.js";
import dotenv from "dotenv";
import admin from "../configs/firebaseAdmin.js";

dotenv.config();
class AuthController {
  // ============================================
  // REGISTER
  // ============================================
  register = catchAsynch(async (req, res, next) => {
    const result = await userService.register(req.body);

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: result,
    });
  });

  // ============================================
  // LOGIN
  // ============================================
  login = catchAsynch(async (req, res, next) => {
    const { email, password } = req.body;
    console.log("Email:", email, "Password:", password);

    const result = await userService.login(email, password);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  });

  // ============================================
  // REFRESH TOKEN
  // ============================================
  refreshToken = catchAsynch(async (req, res, next) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError("Refresh token is required", 400);
    }

    const result = await userService.refreshAccessToken(refreshToken);

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: result,
    });
  });

  // ============================================
  // LOGOUT
  // ============================================
  logout = catchAsynch(async (req, res, next) => {
    const uid = req.user.user || req.user.userId;
    const result = await userService.logout(uid);

    res.status(200).json({
      success: true,
      message: "Logout successful",
      data: result,
    });
  });

  // ============================================
  // FORGOT PASSWORD
  // ============================================
  forgotPassword = catchAsynch(async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
      throw new AppError("Email is required", 400);
    }

    const result = await userService.forgotPassword(email);

    // TODO: Send email with resetToken
    // await emailService.sendPasswordResetEmail(email, result.resetToken);

    res.status(200).json({
      success: true,
      message: result.message,
      expiresIn: result.expiresIn,

      ...(process.env.NODE_ENV === "development" && {
        resetToken: result.resetToken,
      }),
    });
  });

  // ============================================
  //OTP VERIFICATION
  // ============================================

  verifyOtpController = catchAsynch(async (req, res, next) => {
    try {
      const { email, code } = req.body;

      console.log("otp backend ==>", code);
      const result = await userService.otpVerification(email, code);

      return res.status(200).json(result);
    } catch (error) {
      next(error); // passe à ton errorHandler global
    }
  });
  // ============================================
  // RESET PASSWORD
  // ============================================
  resetPasswordController = catchAsynch(async (req, res, next) => {
    const { token, newPassword } = req.body;

    console.log("token and newpassoword ===>", req.body);
    console.log("token and newpassoword ===>", !!req.body);
    if (!token || !newPassword) {
      throw new AppError("Token, and new password are required", 400);
    }

    const result = await userService.resetPassword(token, newPassword);

    res.status(result.success ? 200 : 400).json({
      success: result.success,
      message: result.message,
    });
  });

  // ============================================
  // CHANGE PASSWORD
  // ============================================
  changePassword = catchAsynch(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError("Current and new password are required", 400);
    }

    const uid = req.user.user || req.user.userId;
    const result = await userService.changePassword(
      uid,
      currentPassword,
      newPassword
    );

    res.status(200).json({
      success: true,
      message: result.message,
    });
  });

  // ============================================
  // GET CURRENT USER
  // ============================================
  getCurrentUser = catchAsynch(async (req, res, next) => {
    const uid = req.user.user || req.user.userId;
    const user = await userService.getCurrentUser(uid);

    res.status(200).json({
      success: true,
      user: user,
    });
  });

  // ============================================
  // UPDATE PROFILE
  // ============================================
  updateProfile = catchAsynch(async (req, res, next) => {
    const uid = req.user.user || req.user.userId;
    const user = await userService.updateProfile(uid, req.body);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: { user },
    });
  });

  // ============================================
  // GET ALL USERS (Admin only)
  // ============================================
  getAllUsers = catchAsynch(async (req, res, next) => {
    const { role, isActive, search, page, limit } = req.query;

    const result = await userService.getAllUsers(
      { role, isActive, search },
      page,
      limit
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  // ============================================
  // GET USER BY ID (Admin only)
  // ============================================
  getUserById = catchAsynch(async (req, res, next) => {
    const { id } = req.params;
    const user = await userService.getUserById(id);

    res.status(200).json({
      success: true,
      data: { user },
    });
  });

  // ============================================
  // GET USERS BY ROLE (Admin only)
  // ============================================
  getUsersByRole = catchAsynch(async (req, res, next) => {
    const { role } = req.params;
    const users = await userService.getUsersByRole(role);

    res.status(200).json({
      success: true,
      data: { users },
    });
  });

  // ============================================
  // SUSPEND USER (Admin only)
  // ============================================
  suspendUser = catchAsynch(async (req, res, next) => {
    const { id } = req.params;
    const user = await userService.suspendUser(id);

    res.status(200).json({
      success: true,
      message: "User suspended successfully",
      data: { user },
    });
  });

  // ============================================
  // ACTIVATE USER (Admin only)
  // ============================================
  activateUser = catchAsynch(async (req, res, next) => {
    const { id } = req.params;
    const user = await userService.activateUser(id);

    res.status(200).json({
      success: true,
      message: "User activated successfully",
      data: { user },
    });
  });

  // ============================================
  // DELETE USER (Admin only)
  // ============================================
  deleteUser = catchAsynch(async (req, res, next) => {
    const { id } = req.params;
    const result = await userService.deleteUser(id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  });

  // ============================================
  // UPDATE REALTOR BANK DETAILS
  // ============================================
  updateRealtorBankDetails = catchAsynch(async (req, res, next) => {
    const { id } = req.params;
    const user = await userService.updateRealtorBankDetails(id, req.body);

    res.status(200).json({
      success: true,
      message: "Bank details updated successfully",
      data: { user },
    });
  });

  // ============================================
  // GET USER STATISTICS (Admin only)
  // ============================================
  getUserStatistics = catchAsynch(async (req, res, next) => {
    const stats = await userService.getUserStatistics();

    res.status(200).json({
      success: true,
      data: stats,
    });
  });

  // ============================================
  // VERIFY EMAIL
  // ============================================
  verifyEmail = catchAsynch(async (req, res, next) => {
    const { token } = req.params;

    if (!token) {
      throw new AppError("Verification token is required", 400);
    }

    const result = await userService.verifyEmail(token);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  });

  // ============================================
  // SEND EMAIL VERIFICATION
  // ============================================
  sendEmailVerification = catchAsynch(async (req, res, next) => {
    const token = await userService.generateEmailVerificationToken(
      req.user.userId
    );

    // TODO: Send email with verification token
    // await emailService.sendVerificationEmail(req.user.email, token);

    res.status(200).json({
      success: true,
      message: "Verification email sent",
      ...(process.env.NODE_ENV === "development" && { token }),
    });
  });
}

export default new AuthController();
