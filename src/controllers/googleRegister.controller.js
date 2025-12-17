import admin from "../configs/firebaseAdmin.js";
import User from "../models/Auth.models.js";
import userService from "../services/user.service.js";
import { AppError } from "../utils/appError.utils.js";
import { catchAsynch } from "../utils/catchAsynch.utils.js";

class AuthGoogleController {
  // ============================================
  // Google register controller
  // ============================================
  googleRegister = catchAsynch(async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new AppError("Firebase ID token is required", 400);
    }

    const idToken = authHeader.split(" ")[1];

    const decodedToken = await admin.auth().verifyIdToken(idToken);

    if (!decodedToken.email) {
      throw new AppError("Email not found in Google account", 400);
    }

    const result = await userService.register({
      email: decodedToken.email,
      fullName: req.body.fullName,
      role: req.body.role,
      phoneNumber: req.body.phoneNumber,
      provider: "google",
      isVerified: true,
      termsCondition: true,
    });

    res.status(201).json({
      success: true,
      message: "Google signup successful",
      data: result,
    });
  });

  // ============================================
  // Google check controller
  // ============================================
  googleCheck = catchAsynch(async (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new AppError("Google token is required", 401);
    }

    const idToken = authHeader.split(" ")[1];

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const email = decodedToken.email;

    if (!email) {
      throw new AppError("Invalid Google token", 401);
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        success: true,
        exists: false,
      });
    }

    const isProfileComplete =
      Boolean(user.role) &&
      Boolean(user.firstName) &&
      Boolean(user.lastName) &&
      Boolean(user.phoneNumber);

    const token = userService.generateAccessToken(user._id, user.role);

    res.status(200).json({
      success: true,
      exists: true,
      isProfileComplete,
      user,
      token,
      role: user.role,
    });
  });
}

export default new AuthGoogleController();
