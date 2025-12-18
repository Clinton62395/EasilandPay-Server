import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import errorHandler from "./middlewares/errorHandleler.js";
import connectDB from "./configs/database.configs.js";
import compression from "compression";
import { logger } from "./utils/logger.js";
import mongoSanitize from "express-mongo-sanitize";
import authEditors from "./routes/editors.routes.js";
import authPlan from "./routes/plan.routes.js";
import authWallet from "./routes/wallet.routes.js";
import webhookRoute from "./routes/webhook.routes.js";
import authTransaction from "./routes/transaction.routes.js";
import authRoutes from "./routes/user.routes.js";
import Swagger from "./docs/swagger.js";
import authRealtors from "./routes/realtors.routes.js";
import authGoogle from "./routes/googleRegister.routes.js";
import NewLetter from "./routes/newsLetter.routes.js";
import authCommission from "./routes/commission.routes.js";

dotenv.config();

const app = express();

// ---------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// ---------------------
// GLOBAL MIDDLEWARES
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan("dev"));
// app.use(mongoSanitize({ replaceWith: "_", allowDots: true }));

// ---------------------
// SWAGGER DOCUMENTATION
// ---------------------

// ---------------------
// YOUR API ROUTES
// ---------------------
// Routes for user management (registration, login, profile, etc.)
app.use("/auth/", authRoutes);

// Routes for wallet management (check balance, credit, debit, etc.)
app.use("/wallet", authWallet);

// Routes for relator management (check balance, credit, debit, etc.)
app.use("/realtor", authRealtors);

// Routes for advanced authentication or editor operations (permissions, roles, etc.)
app.use("/api/auth", authEditors);

// Routes for  commission  operations 
app.use("/api/auth", authCommission);

// Routes for financial plan management (CRUD plans, calculations, activation/deactivation)
app.use("/api/plan", authPlan);

// Routes for transaction management (credit, debit, commission, refund, history)
app.use("/transaction", authTransaction);

// Routes for google registering management
app.use("/api/", authGoogle);
// Routes for newsLetter  management
app.use("/newsletter/", NewLetter);

// Route to receive PSP webhooks (Flutterwave, Paystack, etc.)
// These webhooks automatically update the wallet after payments or refunds
app.use("/webhook", webhookRoute);

// (You can add your other routes here)

Swagger(app);
// ---------------------
// ---------------------
// DEFAULT ROUTE
// ---------------------
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Functional API",
    documentation: "/api-docs",
    api: "/api",
  });
});

// 404 MIDDLEWARE
// ---------------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
});

// ---------------------
// GLOBAL ERROR HANDLER
// ---------------------
app.use(errorHandler);

// ---------------------
// START SERVER
// ---------------------
const startServer = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      logger.info(`🌹 Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    logger.error("❌ Error starting server :", err);
    process.exit(1);
  }
};

startServer();
