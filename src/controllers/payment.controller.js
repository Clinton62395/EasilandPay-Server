// payment.controller.js - VERSION SIMPLIFIÉE

import Transaction from "../models/Transaction.moddels.js";
import flutterwaveService from "../services/flutterwave.service.js";
import transactionService from "../services/fwt.transaction.service.js";

class PaymentController {
  // 1. TOP-UP - Simple et clair
  initializePayment = async (req, res) => {
    const { amountInNaira, userId } = req.body;

    // → Créer transaction PENDING via service
    const transaction = await transactionService.createPendingForFlutterwave(
      userId,
      "CREDIT",
      amountInNaira,
      { description: `Top-up ${amountInNaira} NGN` }
    );

    // → Générer lien Flutterwave
    const paymentData = await flutterwaveService.initializePayment({
      amountInNaira,
      email: user.email,
      reference: transaction.reference, // Donner ta référence
    });

    // → Sauver la référence Flutterwave
    transaction.metadata.gatewayReference = paymentData.tx_ref;
    await transaction.save();

    res.json({ paymentLink: paymentData.paymentLink });
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
  verifyPayment = async (req, res) => {
    try {
      const { reference } = req.params; // Ex: /verify/FLW_CREDIT_1234567890_...

      console.log(`🔍 Vérification de la transaction: ${reference}`);

      // 1. Trouver la transaction par ta référence interne
      const transaction = await Transaction.findOne({
        reference,
      }).populate("userId", "email");

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: "Transaction non trouvée",
        });
      }

      // 2. Si transaction déjà terminée, retourner direct
      if (transaction.status !== "PENDING") {
        return res.status(200).json({
          success: true,
          data: {
            status: transaction.status,
            transaction: transaction,
          },
        });
      }

      // 3. Si on a une référence Flutterwave, vérifier auprès d'eux
      if (transaction.metadata.gatewayReference) {
        console.log(
          `Vérification avec Flutterwave: ${transaction.metadata.gatewayReference}`
        );

        const verification = await flutterwaveService.verifyTransaction(
          transaction.metadata.gatewayReference
        );

        // 4. Si Flutterwave dit "succès", traiter le paiement
        if (verification.data.status === "successful") {
          console.log(`✅ Flutterwave confirme le paiement`);

          await transactionService.processSuccessfulPayment(
            transaction._id,
            verification.data
          );

          // Recharger la transaction mise à jour
          const updatedTransaction = await Transaction.findById(
            transaction._id
          );

          return res.status(200).json({
            success: true,
            data: {
              status: "SUCCESS",
              transaction: updatedTransaction,
            },
          });
        }

        // 5. Si Flutterwave dit "échec", annuler
        if (verification.data.status === "failed") {
          console.log(`❌ Flutterwave indique un échec`);

          await transactionService.cancelPendingTransaction(
            transaction._id,
            `Échec confirmé par Flutterwave: ${verification.data.processor_response}`
          );

          const updatedTransaction = await Transaction.findById(
            transaction._id
          );

          return res.status(200).json({
            success: false,
            data: {
              status: "FAILED",
              transaction: updatedTransaction,
            },
          });
        }
      }

      // 6. Si toujours pending après vérification
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

      return res.status(500).json({
        success: false,
        message: error.message || "Erreur lors de la vérification",
      });
    }
  };
}

export default new PaymentController();
