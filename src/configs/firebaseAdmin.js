// backend/config/firebase.js
import dotenv from "dotenv";
import admin from "firebase-admin";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if (!admin.apps.length) {
  try {
    let serviceAccount;

    // 🔄 Détection automatique : Prod ou Dev
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      // 🌐 MODE PRODUCTION : Utilise la variable d'environnement
      console.log("🌐 Firebase: Using environment variable (PRODUCTION)");

      const base64Json = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
      const decodedJson = Buffer.from(base64Json, "base64").toString("utf8");
      serviceAccount = JSON.parse(decodedJson);
    } else {
      // 💻 MODE DÉVELOPPEMENT : Utilise le fichier local
      console.log("💻 Firebase: Using local file (DEVELOPMENT)");

      const serviceAccountPath = join(__dirname, "./serviceAccountKey.json");

      if (!existsSync(serviceAccountPath)) {
        throw new Error(
          "❌ serviceAccountKey.json not found in config/ folder.\n" +
            "Download it from Firebase Console → Project Settings → Service Accounts"
        );
      }

      serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
    }

    // ✅ Initialisation Firebase
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log("✅ Firebase Admin initialized successfully");
    console.log("📌 Project ID:", serviceAccount.project_id);
    console.log("📧 Client Email:", serviceAccount.client_email);
  } catch (err) {
    console.error("❌ Error initializing Firebase Admin:", err.message);
    console.error("📖 Stack trace:", err.stack);
    process.exit(1);
  }
}

export default admin;
