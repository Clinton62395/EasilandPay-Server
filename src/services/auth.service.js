import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { AppError } from "../utils/appError.utils.js";
import dotenv from "dotenv";
import User from "../models/Auth.models.js";
import Wallet from "../models/Wallet.models.js";

dotenv.config();

class UserService {
  // ============================================
  // JWT TOKEN GENERATION
  // ============================================

  /**
   * Generate JWT access token (short-lived: 15min)
   */
  generateAccessToken(userId, role) {
    return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || "15m",
    });
  }

  /**
   * Generate refresh token (long-lived: 7 days)
   */
  generateRefreshToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d",
    });
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new AppError("Invalid or expired token", 401);
    }
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      throw new AppError("Invalid or expired refresh token", 401);
    }
  }

  // ============================================
  // REGISTER (CREATE USER)
  // ============================================

  async register(userData) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const {
        email,
        password,
        role,
        fullName,
        phoneNumber,
        companyInfo,
        realtorInfo,
      } = userData;

      // 1. Check if email exists
      const existingUser = await User.findOne({ email }).session(session);
      if (existingUser) {
        throw new AppError("Email already registered", 400);
      }

      // 2. Create user

      let firstName = "";
      let lastName = "";
      if (fullName) {
        const namePart = fullName.split(" ");
        firstName = namePart[0] || "";
        lastName = namePart.slice(1).join(" ") || "";
      }

      const [newUser] = await User.create(
        [
          {
            email,
            password,
            role,
            firstName,
            lastName,
            phoneNumber,
            companyInfo: role === "company" ? companyInfo : undefined,
            realtorInfo: role === "realtor" ? realtorInfo : undefined,
          },
        ],
        { session }
      );

      // 3. Create wallet for specific roles
      const rolesWithWallet = ["buyer", "realtor", "company"];
      if (rolesWithWallet.includes(role)) {
        await Wallet.create(
          [
            {
              userId: newUser._id,
              balanceInKobo: 0,
              lockedAmountInKobo: 0,
              paidAmountInKobo: 0,
            },
          ],
          { session }
        );
      }

      // 4. Commit transaction
      await session.commitTransaction();

      // 5. Generate tokens
      const accessToken = this.generateAccessToken(newUser._id, newUser.role);
      const refreshToken = this.generateRefreshToken(newUser._id);

      // 6. Save refresh token to user
      newUser.refreshToken = refreshToken;
      await newUser.save();

      // Return user without password
      const userObject = newUser.toObject();
      delete userObject.password;
      delete userObject.refreshToken;

      return {
        user: userObject,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ============================================
  // LOGIN
  // ============================================

  async login(email, password) {
    // 1. Check if user exists and get password
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    // 2. Check if account is active
    if (!user.isActive) {
      throw new AppError("Account is suspended. Contact support.", 403);
    }

    // 3. Verify password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      throw new AppError("Invalid credentials", 401);
    }

    // 4. Generate tokens
    const accessToken = this.generateAccessToken(user._id, user.role);
    const refreshToken = this.generateRefreshToken(user._id);

    // 5. Save refresh token to database
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    // 6. Return user without sensitive data
    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.refreshToken;

    return {
      user: userObject,
      accessToken,
      refreshToken,
    };
  }

  // ============================================
  // REFRESH ACCESS TOKEN
  // ============================================

  async refreshAccessToken(refreshToken) {
    // 1. Verify refresh token
    const decoded = this.verifyRefreshToken(refreshToken);

    // 2. Find user and verify refresh token matches
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.refreshToken !== refreshToken) {
      throw new AppError("Invalid refresh token", 401);
    }

    if (!user.isActive) {
      throw new AppError("Account is suspended", 403);
    }

    // 3. Generate new access token
    const newAccessToken = this.generateAccessToken(user._id, user.role);

    return {
      accessToken: newAccessToken,
    };
  }

  // ============================================
  // LOGOUT
  // ============================================

  async logout(userId) {
    // Clear refresh token from database
    const user = await User.findByIdAndUpdate(
      userId,
      { refreshToken: null },
      { new: true }
    );

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return { message: "Logged out successfully" };
  }

  // ============================================
  // FORGOT PASSWORD (Generate reset token)
  // ============================================

  async forgotPassword(email) {
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if email exists (security)
      return {
        message: "If that email exists, a reset link has been sent",
      };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash token before saving to DB
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Save hashed token and expiry (10 minutes)
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // Return plain token (will be sent via email)
    return {
      resetToken,
      message: "Password reset token generated",
    };
  }

  // ============================================
  // RESET PASSWORD (With token)
  // ============================================

  async resetPassword(resetToken, newPassword) {
    // Hash the token from URL
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Find user with valid token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new AppError("Invalid or expired reset token", 400);
    }

    // Update password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return { message: "Password reset successfully" };
  }

  // ============================================
  // CHANGE PASSWORD (While logged in)
  // ============================================

  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select("+password");

    if (!user) {
      throw new AppError("User not found", 404);
    }

    // Verify current password
    const isPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      throw new AppError("Current password is incorrect", 401);
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return { message: "Password changed successfully" };
  }

  // ============================================
  // GET USER BY ID
  // ============================================

  async getUserById(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError("Invalid user ID", 400);
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }

  // ============================================
  // UPDATE PROFILE
  // ============================================

  async updateProfile(userId, updates) {
    // Forbidden fields
    const forbiddenFields = [
      "password",
      "email",
      "role",
      "createdAt",
      "refreshToken",
    ];
    forbiddenFields.forEach((field) => delete updates[field]);

    const user = await User.findByIdAndUpdate(
      userId,
      { ...updates, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }

  // ============================================
  // GET ALL USERS (With filters & pagination)
  // ============================================

  async getAllUsers(filters = {}, page = 1, limit = 20) {
    const { role, isActive, search } = filters;
    const query = {};

    if (role) query.role = role;
    if (isActive !== undefined) {
      query.isActive = isActive === "true" || isActive === true;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      User.find(query)
        .select("-password -refreshToken")
        .limit(parseInt(limit))
        .skip(skip)
        .sort({ createdAt: -1 }),
      User.countDocuments(query),
    ]);

    return {
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit),
      },
    };
  }

  // ============================================
  // GET USERS BY ROLE
  // ============================================

  async getUsersByRole(role) {
    const validRoles = ["buyer", "realtor", "company", "staff", "admin"];
    if (!validRoles.includes(role)) {
      throw new AppError("Invalid role", 400);
    }

    const users = await User.find({ role, isActive: true })
      .select("-password -refreshToken")
      .sort({ createdAt: -1 });

    return users;
  }

  // ============================================
  // SUSPEND USER
  // ============================================

  async suspendUser(userId) {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false, refreshToken: null },
      { new: true }
    );

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }

  // ============================================
  // ACTIVATE USER
  // ============================================

  async activateUser(userId) {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: true },
      { new: true }
    );

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  }

  // ============================================
  // DELETE USER
  // ============================================

  async deleteUser(userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findById(userId).session(session);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      // Check wallet balance
      const wallet = await Wallet.findOne({ userId }).session(session);
      if (wallet && wallet.balanceInKobo > 0) {
        throw new AppError(
          "Cannot delete user with non-zero wallet balance",
          400
        );
      }

      // Delete wallet
      if (wallet) {
        await Wallet.findByIdAndDelete(wallet._id).session(session);
      }

      // Delete user
      await User.findByIdAndDelete(userId).session(session);

      await session.commitTransaction();
      return { message: "User deleted successfully" };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ============================================
  // UPDATE REALTOR BANK DETAILS
  // ============================================

  async updateRealtorBankDetails(realtorId, bankDetails) {
    const user = await User.findById(realtorId);

    if (!user) {
      throw new AppError("Realtor not found", 404);
    }

    if (user.role !== "realtor") {
      throw new AppError("User is not a realtor", 400);
    }

    user.realtorInfo = {
      ...user.realtorInfo,
      bankDetails: {
        accountNumber: bankDetails.accountNumber,
        bankCode: bankDetails.bankCode,
        bankName: bankDetails.bankName,
        accountName: bankDetails.accountName,
      },
    };

    await user.save();
    return user;
  }

  // ============================================
  // GET USER STATISTICS
  // ============================================

  async getUserStatistics() {
    const [totalUsers, activeUsers, usersByRole, newUsers, recentUsers] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isActive: true }),
        User.aggregate([
          {
            $group: {
              _id: "$role",
              count: { $sum: 1 },
              active: { $sum: { $cond: ["$isActive", 1, 0] } },
            },
          },
        ]),
        User.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        }),
        User.find()
          .select("firstName lastName email role createdAt")
          .sort({ createdAt: -1 })
          .limit(10),
      ]);

    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      usersByRole,
      newUsersLast30Days: newUsers,
      recentUsers,
    };
  }

  // ============================================
  // VERIFY EMAIL (Bonus)
  // ============================================

  async generateEmailVerificationToken(userId) {
    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    await User.findByIdAndUpdate(userId, {
      emailVerificationToken: hashedToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
    });

    return token;
  }

  async verifyEmail(verificationToken) {
    const hashedToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new AppError("Invalid or expired verification token", 400);
    }

    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return { message: "Email verified successfully" };
  }
}

export default new UserService();
