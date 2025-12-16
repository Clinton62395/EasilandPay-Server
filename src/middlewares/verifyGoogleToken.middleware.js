import admin from "../configs/firebaseAdmin.js";
import { AppError } from "../utils/appError.utils.js";

export const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("Authorization header:", authHeader); // Ajoute ce log pour vérifier l'en-tête

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("No Google token provided", 401));
  }

  const idToken = authHeader.split(" ")[1];
  console.log("ID Token from Google id token:", idToken); // Vérifie le token décodé

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log("Decoded Token:", decodedToken); // Logue le token décodé pour vérifier sa validité
    req.googleUser = decodedToken;
    next();
  } catch (error) {
    console.error("Error verifying token:", error); // Logue l'erreur pour plus de détails
    return next(new AppError("Invalid Google token", 401));
  }
};
