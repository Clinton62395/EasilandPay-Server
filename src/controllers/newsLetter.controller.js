import { catchAsynch } from "../utils/catchAsynch.utils.js";
import { AppError } from "../utils/appError.utils.js";
import newsletterService from "../services/newsLetter.service.js";
import dotenv from "dotenv";
import { transporter } from "../configs/nodemailer.js";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Pour obtenir __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

class NewsletterController {
  subscribe = catchAsynch(async (req, res, next) => {
    const { email } = req.body;

    console.log("email subscribed ===>", email);
    console.log("email subscribed ===>", !!email);

    if (!email) {
      throw new AppError("Email is required", 400);
    }

    // Valider l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new AppError("Please provide a valid email address", 400);
    }

    const { newsletter, token } = await newsletterService.subscribe(email);

    // Envoi email de confirmation d'inscription
    const confirmationTemplatePath = path.join(
      __dirname,
      "..",
      "templates",
      "newsletterConfirmation.html"
    );

    let confirmationHtml = fs.readFileSync(confirmationTemplatePath, "utf-8");

    // Extraire le nom de l'email
    const extractNameFromEmail = (email) => {
      const username = email.split("@")[0];
      // Remplacer les points et underscores par des espaces, et capitaliser
      return username
        .replace(/[._-]/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const userName = extractNameFromEmail(email);
    const subscriptionDate = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Générer un ID de souscription
    const subscriptionId = `NL${Date.now().toString().slice(-6)}${Math.random()
      .toString(36)
      .substr(2, 3)
      .toUpperCase()}`;

    // Remplacer les variables dans le template de confirmation
    confirmationHtml = confirmationHtml
      .replace(/\${name}/g, userName)
      .replace(/\${email}/g, email)
      .replace(/\${subscriptionDate}/g, subscriptionDate)
      .replace(/\${frequency}/g, "Weekly")
      .replace(/\${subscriptionId}/g, subscriptionId)
      .replace(
        /\${preferencesLink}/g,
        `${process.env.CLIENT_URL}/newsletter/preferences?token=${token}`
      )
      .replace(
        /\${unsubscribeLink}/g,
        `${process.env.CLIENT_URL}/newsletter/unsubscribe?token=${token}`
      )
      .replace(/\${privacyLink}/g, `${process.env.CLIENT_URL}/privacy`)
      .replace(/\${contactLink}/g, `${process.env.CLIENT_URL}/contact`)
      .replace(/\${currentYear}/g, new Date().getFullYear())
      .replace(/\${companyName}/g, process.env.APP_NAME || "Easyland")
      .replace(
        /\${companyAddress}/g,
        process.env.COMPANY_ADDRESS || "123 Business Street, City"
      );

    // Version texte pour l'email de confirmation
    const confirmationText = `
Confirm Your Subscription to ${process.env.APP_NAME || "Our"} Newsletter!

Hello ${userName},

Thank you for subscribing to our newsletter!

To complete your subscription, please confirm your email by clicking the link below:
${process.env.CLIENT_URL}/newsletter/confirm/${token}

SUBSCRIPTION DETAILS:
• Email: ${email}
• Date: ${subscriptionDate}
• ID: #${subscriptionId}

If you didn't request this subscription, you can ignore this email.

Best regards,
${process.env.APP_NAME || "Easyland"} Team

Manage preferences: ${
      process.env.CLIENT_URL
    }/newsletter/preferences?token=${token}
Unsubscribe: ${process.env.CLIENT_URL}/newsletter/unsubscribe?token=${token}
`;

    const confirmationMailOptions = {
      from:
        process.env.EMAIL_FROM ||
        `"${process.env.APP_NAME || "Easyland"}" <newsletter@easyland.com>`,
      to: email,
      subject: `Please Confirm Your ${
        process.env.APP_NAME || "Easyland"
      } Newsletter Subscription`,
      html: confirmationHtml,
      text: confirmationText,
      headers: {
        "List-Unsubscribe": `<${process.env.CLIENT_URL}/newsletter/unsubscribe?token=${token}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        "X-Auto-Response-Suppress": "All",
      },
    };

    // Envoyer l'email de confirmation

    try {
      await transporter.sendMail(confirmationMailOptions);
    } catch (err) {
      console.error("Mail sending failed:", err);
      throw new AppError("Failed to send confirmation email", 500);
    }

    res.status(201).json({
      success: true,
      message: "Subscription successful. Please check your email to confirm.",
      data: {
        email: newsletter.email,
        subscribedAt: newsletter.subscribedAt,
        requiresConfirmation: true,
      },
    });
  });

  confirm = catchAsynch(async (req, res) => {
    const { token } = req.params;

    const subscriber = await newsletterService.confirmSubscription(token);

    // ENVOI DE L'EMAIL DE BIENVENUE (votre template)
    const welcomeTemplatePath = path.join(
      __dirname,
      "..",
      "templates",
      "subscriptionConfirmed.html" // Votre template de bienvenue
    );

    // Vérifier si le template existe
    if (!fs.existsSync(welcomeTemplatePath)) {
      console.warn(
        "Welcome template not found, creating default welcome email"
      );

      // Créer le template par défaut si inexistant
      const defaultTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Subscription Confirmed</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; text-align: center;">
        <div style="color: #28a745; font-size: 48px; margin-bottom: 20px;">
            ✅
        </div>
        <h1 style="color: #333;">Subscription Confirmed!</h1>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Hello <strong>\${name}</strong>,
        </p>
        <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Your email <strong>\${email}</strong> has been successfully confirmed for our newsletter.
        </p>
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 30px 0;">
            <p style="color: #28a745; font-weight: bold; margin: 0;">
                You're all set! Expect our first newsletter soon.
            </p>
        </div>
        <p style="color: #999; font-size: 14px;">
            Thank you for joining the \${companyName} community!
        </p>
    </div>
</body>
</html>`;

      fs.writeFileSync(welcomeTemplatePath, defaultTemplate);
    }

    let welcomeHtml = fs.readFileSync(welcomeTemplatePath, "utf-8");

    // Extraire le nom de l'email pour le template de bienvenue
    const extractNameFromEmail = (email) => {
      const username = email.split("@")[0];
      return username
        .replace(/[._-]/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const userName = extractNameFromEmail(subscriber.email);

    // Remplacer les variables dans le template de bienvenue
    welcomeHtml = welcomeHtml
      .replace(/\${name}/g, userName)
      .replace(/\${email}/g, subscriber.email)
      .replace(/\${companyName}/g, process.env.APP_NAME || "Easyland");

    // Version texte pour l'email de bienvenue
    const welcomeText = `
Welcome to ${process.env.APP_NAME || "Our"} Newsletter!

Hello ${userName},

Your subscription has been confirmed successfully!

Email: ${subscriber.email}
Confirmed: ${new Date().toLocaleDateString()}

You're all set! Expect our first newsletter soon.

We'll send you:
• Weekly curated content and insights
• Exclusive offers and promotions
• Latest updates and announcements

Thank you for joining the ${process.env.APP_NAME || "Easyland"} community!

Best regards,
${process.env.APP_NAME || "Easyland"} Team

Manage preferences: ${process.env.CLIENT_URL}/newsletter/preferences
Unsubscribe: ${process.env.CLIENT_URL}/newsletter/unsubscribe
`;

    const welcomeMailOptions = {
      from:
        process.env.EMAIL_FROM ||
        `"${process.env.APP_NAME || "Easyland"}" <welcome@easyland.com>`,
      to: subscriber.email,
      subject: `🎉 Welcome to ${
        process.env.APP_NAME || "Easyland"
      } Newsletter!`,
      html: welcomeHtml,
      text: welcomeText,
      headers: {
        "List-Unsubscribe": `<${process.env.CLIENT_URL}/newsletter/unsubscribe>`,
        "X-Auto-Response-Suppress": "All",
        Precedence: "bulk", // Pour les newsletters
      },
    };

    // Envoyer l'email de bienvenue
    await transporter.sendMail(welcomeMailOptions);

    res.status(200).json({
      success: true,
      message:
        "Subscription confirmed successfully! Welcome to our newsletter.",
      data: {
        email: subscriber.email,
        isConfirmed: subscriber.isConfirmed,
        confirmedAt: subscriber.confirmedAt,
      },
    });
  });

  // Méthode pour tester l'envoi d'email de bienvenue
  testWelcomeEmail = catchAsynch(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      throw new AppError("Email is required for testing", 400);
    }

    // Charger et préparer le template de bienvenue
    const welcomeTemplatePath = path.join(
      __dirname,
      "..",
      "templates",
      "subscriptionConfirmed.html"
    );

    if (!fs.existsSync(welcomeTemplatePath)) {
      throw new AppError("Welcome template not found", 404);
    }

    let welcomeHtml = fs.readFileSync(welcomeTemplatePath, "utf-8");

    const extractNameFromEmail = (email) => {
      const username = email.split("@")[0];
      return username
        .replace(/[._-]/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const userName = extractNameFromEmail(email);

    welcomeHtml = welcomeHtml
      .replace(/\${name}/g, userName)
      .replace(/\${email}/g, email)
      .replace(/\${companyName}/g, process.env.APP_NAME || "Easyland");

    const testMailOptions = {
      from:
        process.env.EMAIL_FROM ||
        `"${process.env.APP_NAME || "Easyland"}" <test@easyland.com>`,
      to: email,
      subject: `🎉 Test: Welcome to ${
        process.env.APP_NAME || "Easyland"
      } Newsletter`,
      html: welcomeHtml,
      text: `Test welcome email for ${email}`,
      headers: {
        "X-Test-Email": "true",
      },
    };

    await transporter.sendMail(testMailOptions);

    res.status(200).json({
      success: true,
      message: "Test welcome email sent successfully",
      data: {
        email: email,
        templateUsed: "subscriptionConfirmed.html",
        timestamp: new Date().toISOString(),
      },
    });
  });

  unsubscribe = catchAsynch(async (req, res) => {
    const { token } = req.params;
    const { email } = req.body;

    const result = await newsletterService.unsubscribe(token, email);

    res.status(200).json({
      success: true,
      message: "Successfully unsubscribed from newsletter",
      data: result,
    });
  });
}

export default new NewsletterController();
