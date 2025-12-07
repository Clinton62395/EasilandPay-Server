import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import errorHandler from "./middlewares/errorHandleler.js";
import connectDB from "./configs/database.configs.js";
import compression from "compression";
import { logger } from "./utils/logger.js";
import setupSwagger from "./utils/swagger.js";
import mongoSanitize from "express-mongo-sanitize";
import authRoutes from "./routes/auth.routes.js";
import authEditors from "./routes/editors.routes.js";
import authPlan from "./routes/plan.routes.js";
import authEscrow from "./routes/escrow.routes.js";

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
app.use("/auth/users", authRoutes);
app.use("/api/auth", authEditors);
app.use("/api/plan", authPlan);
app.use("/api/escrow", authEscrow);
// app.use("/api/payments", paymentRoutes);
// app.use("/api/auth", authRoutes);
// (Tu ajouteras tes routes ici)

setupSwagger(app);
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
