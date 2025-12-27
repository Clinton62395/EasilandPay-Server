import dotenv from "dotenv";

dotenv.config();

export const isProd = process.env.NODE_ENV === "production";

export const FRONTEND_URL = isProd
  ? process.env.FRONTEND_URL_PRO
  : process.env.FRONTEND_URL_DEV;

if (!FRONTEND_URL) {
  throw new Error("FRONTEND_URL is not defined");
}
