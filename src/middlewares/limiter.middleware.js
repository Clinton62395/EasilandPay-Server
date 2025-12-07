import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

dotenv.config();

const adminIp = process.env.MY_IP_ADDRESS;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req, res) => (req.ip === adminIp ? 100 : 50), // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again after 15 minutes",
});
export default limiter;

export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req, res) => (req.ip === adminIp ? 100 : 5), // limit each IP to 5 password reset requests per windowMs
  message:
    "Too many password reset requests from this IP, please try again after 15 minutes",
});
