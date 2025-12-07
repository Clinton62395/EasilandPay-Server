import Flutterwave from "flutterwave-node-v3";
import dotenv from "dotenv";

dotenv.config();

const flw_client_secrete = process.env.FLW_CLIENT_SECRETE;
const flw_client_key = process.env.FLW_CLIENT_ID;

export const flw = new Flutterwave(flw_client_key, flw_client_secrete);
