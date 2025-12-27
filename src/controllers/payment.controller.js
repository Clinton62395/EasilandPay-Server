// payment.controller.js - VERSION SIMPLIFIÉE

import Transaction from "../models/Transaction.moddels.js";
import flutterwaveService from "../services/payment.service.js";
import transactionService from "../services/fwt.transaction.service.js";
import userService from "../services/user.service.js";
import User from "../models/Auth.models.js";
import { AppError } from "../utils/appError.utils.js";

class PaymentController {
  initializePayment = async (req, res, next) => {
    console.log("🚀 initializePayment called", req.body);
    try {
      const { amount } = req.body;
      const userId = req.user.user || req.user.userId;

      if (!amount) {
        console.log("⚠️ Amount missing in request body");
        return next(new AppError("Amount is required", 400));
      }
      // 🔹 Charger l'utilisateur
      const user = await User.findById(userId).select("email fullName");
      if (!user) {
        return next(new AppError("User not found", 404));
      }
      console.log("amout from body", req.body);

      const amountInNaira = parseFloat(amount);

      // Créer transaction PENDING
      const transaction = await transactionService.createPendingForFlutterwave(
        userId,
        "WALLET_DEPOSIT",
        amountInNaira,
        { description: `Top-up ${amountInNaira} NGN` }
      );

      // Initialiser le paiement
      const paymentData = await flutterwaveService.initializeFlutterwavePayment(
        {
          amountInNaira,
          email: user.email,
          reference: transaction.reference,
          meta: { transactionId: transaction._id, user: userId },
        }
      );

      // Sauver la référence Flutterwave
      transaction.metadata.tx_ref = paymentData.tx_ref;
      await transaction.save();

      // Retour frontend
      res.json({ paymentLink: paymentData.paymentLink });
    } catch (err) {
      console.error("initializePayment error:", err);
      res.status(500).json({ message: "Failed to initialize payment" });
    }
  };

  // 2. WEBHOOK - Simple et clair
  handleWebhook = async (req, res) => {
    const { event, data } = req.body;

    if (event === "charge.completed") {
      // Trouver la transaction
      const transaction = await transactionService.findByFlutterwaveReference(
        data.tx_ref
      );

      if (data.status === "successful") {
        // → Service gère tout
        await transactionService.processSuccessfulPayment(
          transaction._id,
          data
        );
      } else {
        // → Service annule tout
        await transactionService.cancelPendingTransaction(
          transaction._id,
          `Flutterwave status: ${data.status}`
        );
      }
    }

    res.sendStatus(200);
  };

  // 3. RETRAIT - Simple et clair
  initiateWithdrawal = async (req, res) => {
    const { userId, amountInNaira, account_bank, account_number } = req.body;

    // → Service gère débit + création transaction
    const transaction = await transactionService.processWithdrawal(
      userId,
      amountInNaira,
      { account_bank, account_number }
    );

    // → Envoyer à Flutterwave
    const transfer = await flutterwaveService.initiateTransfer({
      account_bank,
      account_number,
      amountInNaira,
      reference: transaction.reference, // Ta référence
    });

    // → Sauver l'ID Flutterwave
    transaction.metadata.gatewayReference = transfer.data.reference;
    transaction.metadata.gatewayId = transfer.data.id;
    await transaction.save();

    res.json({ success: true, transactionId: transaction._id });
  };

  // 4. VÉRIFICATION MANUELLE - Pour le frontend
  verifyPayment = async (req, res, next) => {
    try {
      const { tx_ref } = req.params;

      console.log(`🔍 Vérification de la transaction: ${tx_ref}`);

      if (!tx_ref) {
        return next(new AppError("Référence de transaction manquante", 400));
      }

      // 1. Trouver la transaction par ta référence interne
      const transaction = await Transaction.findOne({
        "metadata.tx_ref": tx_ref,
      }).populate("user", "email");

      if (!transaction) {
        return next(new AppError("Transaction non trouvée", 404));
      }

      // 2. Si transaction déjà terminée, retourner direct
      if (transaction.status !== "PENDING") {
        return res.status(200).json({
          success: true,
          data: {
            tx_ref: transaction.metadata.tx_ref,
            status: transaction.status,
            transaction: transaction,
          },
        });
      }

      // 3. Si on a une référence Flutterwave, vérifier auprès d'eux
      if (transaction.metadata.tx_ref) {
        console.log(
          `Vérification avec Flutterwave: ${transaction.metadata.tx_ref}`
        );

        const verification = await flutterwaveService.verifyPayment(
          transaction.metadata.tx_ref
        );

        // Si le service retourne un statut d'erreur (par exemple, transaction non trouvée)
        if (verification.status === "error") {
          return res.status(200).json({
            success: false,
            data: {
              status: "PENDING",
              message: verification.message,
              transaction: transaction,
            },
          });
        }

        // 4. Si on arrive ici, c'est que la transaction a été trouvée et est réussie
        // (car le service lance une erreur si la transaction n'est pas réussie)
        console.log(`✅ Flutterwave confirme le paiement`);

        await transactionService.processSuccessfulPayment(
          transaction._id,
          verification // verification est déjà les données de la transaction
        );

        // Recharger la transaction mise à jour
        const updatedTransaction = await Transaction.findById(transaction._id);

        return res.status(200).json({
          success: true,
          data: {
            status: "SUCCESS",
            transaction: updatedTransaction,
          },
        });
      }

      // 5. Si toujours pending après vérification
      return res.status(200).json({
        success: true,
        data: {
          status: "PENDING",
          message: "Transaction en attente de confirmation",
          transaction: transaction,
        },
      });
    } catch (error) {
      console.error("Erreur lors de la vérification:", error);

      // Si l'erreur vient du service (transaction non réussie)
      if (error instanceof AppError) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message || "Erreur lors de la vérification",
      });
    }
  };
}

export default new PaymentController();
