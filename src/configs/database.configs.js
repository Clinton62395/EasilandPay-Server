import mongoose from "mongoose";
import dotenv from "dotenv";
import { logger } from "../utils/logger.js";

dotenv.config();
const mongo_url = process.env.MONGODB_URI;

const connectDB = async () => {
  try {
    if (!mongo_url) {
      throw new Error("⛔mongo url is not defined in environnement env");
    }

    logger.warn(`attempting to mongodb url , ${mongo_url}`);
    await mongoose.connect(mongo_url);

    logger.info("✅connection to mongodb successfully");
  } catch (err) {
    logger.error("❌error when mongodb connection", err);
  }
};

export default connectDB;
