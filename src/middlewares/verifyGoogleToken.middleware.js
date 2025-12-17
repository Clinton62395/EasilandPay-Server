import admin from "../configs/firebaseAdmin.js";
import { AppError } from "../utils/appError.utils.js";

export const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("No Google token provided", 401));
  }

  const idToken = authHeader.split(" ")[1];

  try {
    // 🔑 Vérifie que c'est un vrai token Firebase
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.googleUser = decodedToken;
    next();
  } catch (error) {
    console.error("Error verifying token:", error);
    return next(new AppError("Invalid Google token", 401));
  }
};
