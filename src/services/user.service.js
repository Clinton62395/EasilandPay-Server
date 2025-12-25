import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { AppError } from "../utils/appError.utils.js";
import dotenv from "dotenv";
import User from "../models/Auth.models.js";
import Wallet from "../models/Wallet.models.js";
import { transporter } from "../configs/nodemailer.js";
import fs from "fs";
import path from "path";

dotenv.config();

class UserService {
  // ============================================
  // JWT TOKEN GENERATION
  // ============================================

  generateAccessToken(userId, role) {
    return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || "15m",
    });
  }

  generateRefreshToken(userId) {
    return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
      expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d",
    });
  }

  verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new AppError("Invalid or expired token", 401);
    }
  }

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

  register = async (userData) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const {
        email,
        password,
        confirmPassword,
        role,
        fullName,
        phoneNumber,
        provider,
        termsCondition,
        companyInfo,
        realtorInfo,
      } = userData;

      // 1. Check if email exists
      const existingUser = await User.findOne({ email }).session(session);
      if (existingUser) {
        throw new AppError("Email already registered", 400);
      }

      // 2. Parse fullName
      let firstName = "";
      let lastName = "";
      if (fullName) {
        const namePart = fullName.split(" ");
        firstName = namePart[0] || "";
        lastName = namePart.slice(1).join(" ") || "";
      }

      // 3. Create user
      const newUser = new User({
        email,
        password,
        role,
        firstName,
        termsCondition,
        lastName,
        phoneNumber,
        provider,
        companyInfo: role === "company" ? companyInfo : undefined,
        realtorInfo: role === "realtor" ? realtorInfo : undefined,
      });

      await newUser.save({ session });

      // 4. Create wallet for specific roles
      const rolesWithWallet = ["buyer", "realtor", "company"];
      if (rolesWithWallet.includes(role)) {
        await Wallet.findOneAndUpdate(
          { user: newUser._id },
          {
            $setOnInsert: {
              balance: 0,
              currency: "NGN",
              totalWithdrawn: 0,
              totalDeposited: 0,
            },
          },
          { upsert: true, new: true, session }
        );
      }

      // 5. Generate tokens
      const token = this.generateAccessToken(newUser._id, newUser.role);
      const refreshToken = this.generateRefreshToken(newUser._id);

      // 6. Save refresh token to user (AVANT le commit)
      newUser.refreshToken = refreshToken;
      await newUser.save({ session });

      // 7. Commit transaction (TOUT en une fois)
      await session.commitTransaction();

      // 8. Return user without sensitive data
      const userObject = newUser.toObject();
      delete userObject.password;
      delete userObject.refreshToken;

      return {
        data: userObject,
        token,
        refreshToken,
        role: userObject.role,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  };

  // ============================================
  // LOGIN
  // ============================================

  login = async (email, password) => {
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      throw new AppError("Invalid credentials", 401);
    }

    if (!user.isActive) {
      throw new AppError("Account is suspended. Contact support.", 403);
    }

    console.log("Stored hash:", user.password);
    console.log("Entered password:", password);

    const isPasswordCorrect = await user.comparePassword(password);
    console.log("Password match:", !!isPasswordCorrect);
    console.log("Password match:", isPasswordCorrect);

    if (!isPasswordCorrect) {
      throw new AppError("Invalid credentials", 401);
    }

    const token = this.generateAccessToken(user._id, user.role);
    const refreshToken = this.generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.refreshToken;

    return {
      user: userObject,
      token,
      role: userObject.role,
      refreshToken,
    };
  };

  // ============================================
  // REFRESH ACCESS TOKEN
  // ============================================

  refreshAccessToken = async (refreshToken) => {
    const decoded = this.verifyRefreshToken(refreshToken);
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

    const newAccessToken = this.generateAccessToken(user._id, user.role);

    return {
      accessToken: newAccessToken,
    };
  };

  // ============================================
  // LOGOUT
  // ============================================

  logout = async (userId) => {
    const user = await User.findByIdAndUpdate(
      userId,
      { refreshToken: null },
      { new: true }
    );

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return { message: "Logged out successfully" };
  };

  // ============================================
  // FORGOT PASSWORD
  // ============================================

  forgotPassword = async (email) => {
    try {
      const user = await User.findOne({ email }).select(
        "+verificationCode +verificationCodeExpires"
      );

      // Sécurité : toujours retourner le même message
      const successResponse = {
        success: true,
        message: "If that email exists, a reset code has been sent",
      };

      if (!user) {
        return successResponse;
      }

      const expiresIn = 10 * 60 * 1000; // 10 min
      // Générer un code à 6 chiffres
      const generateSixDigitCode = () => {
        return Math.floor(100000 + Math.random() * 900000).toString(); // 100000-999999
      };

      const verificationCode = generateSixDigitCode();

      // Stocker le code (hashé pour la sécurité) et l'expiration
      user.verificationCode = crypto
        .createHash("sha256")
        .update(verificationCode)
        .digest("hex");
      user.verificationCodeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

      await user.save();
      // Lire le template
      const templatePath = path.join(
        process.cwd(),
        "src",
        "templates",
        "resetPassword.html"
      );

      let html = fs.readFileSync(templatePath, "utf-8");

      // CORRECTION : Adaptez le template pour afficher le code
      html = html
        .replace(/\${code}/g, verificationCode)
        .replace(/\${name}/g, user.fullName || user.lastName || "User")
        .replace(/\${expirationTime}/g, "10 minutes");

      // Version texte adaptée au code
      const textVersion = `Hello ${user.fullName || "User"},

We received a request to reset your password.

Your verification code is: ${verificationCode}

Enter this code on the password reset page to continue.

This code will expire in 10 minutes.

If you didn't request this, please ignore this email.

Best regards,
YourApp Team`;

      const mailOptions = {
        from: process.env.EMAIL_FROM || '"Support" <support@yourapp.com>',
        to: user.email,
        subject: "Your Password Reset Code - Easyland",
        html: html,
        text: textVersion,
      };

      // Envoyer l'email
      await transporter.sendMail(mailOptions);

      console.log(`✅ Verification code sent to ${user.email}`);

      // ✅ RETOURNER ICI avec les infos d'expiration
      return {
        success: true,
        message: "If that email exists, a reset code has been sent",
        expiresIn, // ✅ `user` existe ici
      };
    } catch (error) {
      console.error("Error in forgotPassword:", error);

      // ✅ RETOURNER dans le catch aussi
      return {
        success: true, // Toujours true pour la sécurité
        message: "If that email exists, a reset code has been sent",
      };
    }
  };
  // ==========================================
  // VERIFY RESET CODE & RETURN RESET TOKEN
  // ==========================================
  otpVerification = async (email, code) => {
    if (!email || !code) {
      throw new AppError("Email and verification code are required", 400);
    }

    // Hash du code reçu
    const hashedCode = crypto.createHash("sha256").update(code).digest("hex");

    // Trouver l'utilisateur
    const user = await User.findOne({
      email,
      verificationCode: hashedCode,
      verificationCodeExpires: { $gt: Date.now() },
    }).select(
      "+verificationCode +verificationCodeExpires +resetPasswordExpires +resetPasswordToken"
    );

    if (!user) {
      throw new AppError("Invalid or expired verification code", 400);
    }

    // Générer reset token (clair)
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hasher le reset token avant stockage
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    // Nettoyer le code OTP
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;

    await user.save();

    return {
      success: true,
      message: "Verification successful",
      resetToken,
    };
  };

  // ============================================
  // RESET PASSWORD
  // ============================================

  // services/userService.js

  resetPassword = async (token, newPassword) => {
    try {
      // 1. HASHER LE TOKEN avant de chercher !
      const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

      console.log("🔍 DEBUG resetPassword:");
      console.log("- Token reçu (clair):", token);
      console.log("- Token hashé:", hashedToken);

      // 2. Trouver l'utilisateur avec le token HASHÉ
      const user = await User.findOne({
        resetPasswordToken: hashedToken, // ← Chercher le HASH
        resetPasswordExpires: { $gt: new Date() },
      }).select("+password +resetPasswordToken +resetPasswordExpires");

      console.log("Utilisateur trouvé:", user);
      console.log("Utilisateur existe?", !!user);

      if (!user) {
        console.log("❌ Aucun utilisateur avec ce token hashé");
        // Debug: Vérifier ce qui est stocké en base
        const allUsers = await User.find({
          resetPasswordToken: { $exists: true },
        }).select("email resetPasswordToken resetPasswordExpires");
        console.log(
          "Tokens en base:",
          allUsers.map((u) => ({
            email: u.email,
            token: u.resetPasswordToken,
            expires: u.resetPasswordExpires,
          }))
        );

        return {
          success: false,
          message: "Invalid or expired reset token",
        };
      }

      // 3. Vérifier que le nouveau mot de passe est différent de l'ancien
      const isSamePassword = await user.comparePassword(newPassword);
      if (isSamePassword) {
        return {
          success: false,
          message: "New password must be different from the old one",
        };
      }

      // 4. Assigner le nouveau mot de passe
      user.password = newPassword;

      // 5. Supprimer le token et sa date d'expiration
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;

      // 6. Sauvegarder
      await user.save();

      return {
        success: true,
        message: "Password has been reset successfully",
      };
    } catch (error) {
      console.error("Reset password error:", error);
      return {
        success: false,
        message: "An error occurred while resetting password",
      };
    }
  };
  // ============================================
  // CHANGE PASSWORD
  // ============================================

  changePassword = async (userId, currentPassword, newPassword) => {
    const user = await User.findById(userId).select("+password");

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const isPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      throw new AppError("Current password is incorrect", 401);
    }

    user.password = newPassword;
    await user.save();

    return { message: "Password changed successfully" };
  };

  // ============================================
  // GET USER BY ID
  // ============================================

  getCurrentUser = async (userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError("Invalid user ID", 400);
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  };

  // ============================================
  // UPDATE PROFILE
  // ============================================

  updateProfile = async (userId, updates) => {
    // 1. Champs strictement autorisés à être modifiés
    const allowedFields = [
      "firstName",
      "lastName",
      "phoneNumber",
      "address",
      "city",
      "country",
      "profileImage",
    ];

    const filteredUpdates = {};

    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });

    // 2. Sécurité : validation structure profileImage
    if (filteredUpdates.profileImage) {
      const { url, public_id } = filteredUpdates.profileImage;

      if (typeof url !== "string" || typeof public_id !== "string") {
        throw new AppError("Invalid profile image format", 400);
      }
      console.log("user profile data==>", filteredUpdates);
    }

    // 3. Mise à jour utilisateur
    const user = await User.findByIdAndUpdate(userId, filteredUpdates, {
      new: true,

      runValidators: true,
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  };

  // ============================================
  // GET ALL USERS
  // ============================================
  // ============================================
  // GET user by Id
  // ============================================

  getUserById = async (userId) => {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError("Invalid user ID", 400);
    }
    return User.findById(userId);
  };

  getAllUsers = async (filters = {}, page = 1, limit = 20) => {
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
  };

  // ============================================
  // GET USERS BY ROLE
  // ============================================

  getUsersByRole = async (role) => {
    const validRoles = ["buyer", "realtor", "company", "staff", "admin"];
    if (!validRoles.includes(role)) {
      throw new AppError("Invalid role", 400);
    }

    const users = await User.find({ role, isActive: true })
      .select("-password -refreshToken")
      .sort({ createdAt: -1 });

    return users;
  };

  // ============================================
  // SUSPEND USER
  // ============================================

  suspendUser = async (userId) => {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false, refreshToken: null },
      { new: true }
    );

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  };

  // ============================================
  // ACTIVATE USER
  // ============================================

  activateUser = async (userId) => {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: true },
      { new: true }
    );

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  };

  // ============================================
  // DELETE USER
  // ============================================

  deleteUser = async (userId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const user = await User.findById(userId).session(session);
      if (!user) {
        throw new AppError("User not found", 404);
      }

      // Check wallet balance - CORRECTION: utiliser "user" au lieu de "userId"
      const wallet = await Wallet.findOne({ user: userId }).session(session);
      if (wallet && wallet.balance > 0) {
        throw new AppError(
          "Cannot delete user with non-zero wallet balance",
          400
        );
      }

      if (wallet) {
        await Wallet.findByIdAndDelete(wallet._id).session(session);
      }

      await User.findByIdAndDelete(userId).session(session);

      await session.commitTransaction();
      return { message: "User deleted successfully" };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  };

  // ============================================
  // UPDATE REALTOR BANK DETAILS
  // ============================================

  updateRealtorBankDetails = async (realtorId, bankDetails) => {
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
  };

  // ============================================
  // GET USER STATISTICS
  // ============================================

  getUserStatistics = async () => {
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
  };

  // ============================================
  // VERIFY EMAIL
  // ============================================

  generateEmailVerificationToken = async (userId) => {
    const token = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    await User.findByIdAndUpdate(userId, {
      emailVerificationToken: hashedToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    return token;
  };

  verifyEmail = async (verificationToken) => {
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
  };
}

export default new UserService();
