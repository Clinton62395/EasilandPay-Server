import dotenv from "dotenv";
import Flutterwave from "flutterwave-node-v3";
dotenv.config();

export const flw = new Flutterwave(
  process.env.FLW_PUBLIC_KEY,
  process.env.FLW_SCRETE_KEY
);
