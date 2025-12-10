import userService from "../services/user.service.js";
import { AppError } from "../utils/appError.utils.js";

class AuthController {
  // ============================================
  // REGISTER
  // ============================================
  async register(req, res, next) {
    try {
      const result = await userService.register(req.body);

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // LOGIN
  // ============================================
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new AppError("Email and password are required", 400);
      }

      const result = await userService.login(email, password);

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // REFRESH TOKEN
  // ============================================
  async refreshToken(req, res, next) {
    try {
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
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // LOGOUT
  // ============================================
  async logout(req, res, next) {
    try {
      const result = await userService.logout(req.user.userId);

      res.status(200).json({
        success: true,
        message: "Logout successful",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // FORGOT PASSWORD
  // ============================================
  async forgotPassword(req, res, next) {
    try {
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
        // Don't send token in production, only via email
        ...(process.env.NODE_ENV === "development" && {
          resetToken: result.resetToken,
        }),
      });
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // RESET PASSWORD
  // ============================================
  async resetPassword(req, res, next) {
    try {
      const { resetToken, newPassword } = req.body;

      if (!resetToken || !newPassword) {
        throw new AppError("Reset token and new password are required", 400);
      }

      const result = await userService.resetPassword(resetToken, newPassword);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // CHANGE PASSWORD
  // ============================================
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        throw new AppError("Current and new password are required", 400);
      }

      const result = await userService.changePassword(
        req.user.userId,
        currentPassword,
        newPassword
      );

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // GET CURRENT USER
  // ============================================
  async getCurrentUser(req, res, next) {
    try {
      const user = await userService.getUserById(req.user.userId);

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // UPDATE PROFILE
  // ============================================
  async updateProfile(req, res, next) {
    try {
      const user = await userService.updateProfile(req.user.userId, req.body);

      res.status(200).json({
        success: true,
        message: "Profile updated successfully",
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // GET ALL USERS (Admin only)
  // ============================================
  async getAllUsers(req, res, next) {
    try {
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
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // GET USER BY ID (Admin only)
  // ============================================
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);

      res.status(200).json({
        success: true,
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // GET USERS BY ROLE (Admin only)
  // ============================================
  async getUsersByRole(req, res, next) {
    try {
      const { role } = req.params;
      const users = await userService.getUsersByRole(role);

      res.status(200).json({
        success: true,
        data: { users },
      });
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // SUSPEND USER (Admin only)
  // ============================================
  async suspendUser(req, res, next) {
    try {
      const { id } = req.params;
      const user = await userService.suspendUser(id);

      res.status(200).json({
        success: true,
        message: "User suspended successfully",
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // ACTIVATE USER (Admin only)
  // ============================================
  async activateUser(req, res, next) {
    try {
      const { id } = req.params;
      const user = await userService.activateUser(id);

      res.status(200).json({
        success: true,
        message: "User activated successfully",
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // DELETE USER (Admin only)
  // ============================================
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      const result = await userService.deleteUser(id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // UPDATE REALTOR BANK DETAILS
  // ============================================
  async updateRealtorBankDetails(req, res, next) {
    try {
      const { id } = req.params;
      const user = await userService.updateRealtorBankDetails(id, req.body);

      res.status(200).json({
        success: true,
        message: "Bank details updated successfully",
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // GET USER STATISTICS (Admin only)
  // ============================================
  async getUserStatistics(req, res, next) {
    try {
      const stats = await userService.getUserStatistics();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // VERIFY EMAIL
  // ============================================
  async verifyEmail(req, res, next) {
    try {
      const { token } = req.params;

      if (!token) {
        throw new AppError("Verification token is required", 400);
      }

      const result = await userService.verifyEmail(token);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  // ============================================
  // SEND EMAIL VERIFICATION
  // ============================================
  async sendEmailVerification(req, res, next) {
    try {
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
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
