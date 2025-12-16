import dotenv from "dotenv";
import admin from "firebase-admin";

dotenv.config();
console.log(process.env.FIREBASE_SERVICE_ACCOUNT);
if (!admin.apps.length) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin initialized successfully");
  } catch (err) {
    console.error("Error initializing Firebase Admin:", err);
  }
}

export default admin;
