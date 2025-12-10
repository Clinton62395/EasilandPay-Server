import { catchAsynch } from "./catchAsynch.utils.js";
import User from "../models/Auth.models.js";
import TransactionService from "../services/transaction.service.js";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

// Webhook Flutterwave
export const flutterwaveWebhook = catchAsynch(async (req, res) => {
  // 1️⃣ Vérification de la signature pour la sécurité
  const hash = req.headers["verif-hash"]; // Flutterwave envoie ce header
  const secret = process.env.FLUTTERWAVE_SECRET_KEY;

  const payload = JSON.stringify(req.body);
  const computedHash = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  if (hash !== computedHash) {
    // Si signature invalide, rejeter la requête
    return res.status(400).send("Invalid signature");
  }

  // 2️⃣ Récupération de l'événement envoyé par Flutterwave
  const event = req.body;

  // On ne traite que les paiements réussis
  if (
    event.event === "charge.completed" &&
    event.data.status === "successful"
  ) {
    const tx = event.data;

    // 3️⃣ Trouver l'utilisateur correspondant via l'email
    const user = await User.findOne({ email: tx.customer.email });
    if (!user) return res.status(404).send("User not found");

    // 4️⃣ Vérifier si la transaction a déjà été traitée (idempotency)
    const exists = await TransactionService.getTransactionByReference(
      tx.tx_ref
    ).catch(() => null);
    if (exists) return res.status(200).send("Transaction already processed");

    // 5️⃣ Convertir le montant en kobo (Flutterwave renvoie en devise standard)
    const amountInKobo = Math.round(tx.amount * 100);

    // 6️⃣ Créer la transaction via le service
    // Cela met à jour le wallet et crée un enregistrement audit trail
    await TransactionService.creditWallet(
      user._id,
      amountInKobo,
      "Wallet funding via Flutterwave",
      {
        paymentGateway: "flutterwave", // Nom du gateway
        paymentMethod: tx.payment_type, // Carte, USSD, etc.
        gatewayReference: tx.tx_ref, // Référence Flutterwave
        initiatedAt: new Date(tx.created_at), // Date de création côté Flutterwave
        completedAt: new Date(), // Date de traitement dans notre système
      }
    );

    console.log(`Wallet mis à jour pour ${user.email}, +${amountInKobo} kobo`);
  }

  // 7️⃣ Répondre à Flutterwave pour confirmer la réception
  res.status(200).send("ok");
});
