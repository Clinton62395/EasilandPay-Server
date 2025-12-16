import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Créer un transporteur SMTP
export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // À remplacer selon le service
  port: process.env.SMTP_PORT,
  secure: false, // true pour le port 465, false pour 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
