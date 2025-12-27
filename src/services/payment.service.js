import axios from "axios";
import { AppError } from "../utils/appError.utils.js";
import { catchAsynch } from "../utils/catchAsynch.utils.js";
import dotenv from "dotenv";
import { FRONTEND_URL } from "../configs/app.config.js";

dotenv.config();

class FlutterwaveService {
  constructor() {
    this.baseURL = "https://api.flutterwave.com/v3";
    this.secretKey = process.env.FLW_SECRET_KEY;
    this.publicKey = process.env.FLW_PUBLIC_KEY;
    this.encryptionKey = process.env.FLW_ENCRYPTION_KEY;
    this.webhookHash = process.env.FLW_WEBHOOK_HASH;

    // Debug: afficher les clés (à retirer en production)
    console.log("Flutterwave Service Initialized");
    console.log("Base URL:", this.baseURL);
    console.log("Secret Key present:", !!this.secretKey);
    console.log("Public Key present:", !!this.publicKey);
  }

  // Générer une référence unique pour Flutterwave
  generateReference(prefix = "EASILAND") {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `${prefix}_${timestamp}_${random}`;
  }

  // Initialiser un paiement
  async initializeFlutterwavePayment({
    amountInNaira,
    email,
    userId,
    user,
    currency = "NGN",
    redirectUrl = `${FRONTEND_URL}/payments/verify`,
    meta = {},
  }) {
    const tx_ref = this.generateReference("FLW");

    const amount = parseFloat(amountInNaira);
    const uid = user || userId;

    const payload = {
      tx_ref,
      amount,
      currency,
      redirect_url: redirectUrl,
      customer: {
        email,
        name: `User_${uid}`,
      },
      customizations: {
        title: "EasilandPay",
        description: "Wallet Funding",
      },
      meta: {
        ...meta,
        user: uid,
      },
    };

    const response = await axios.post(`${this.baseURL}/payments`, payload, {
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.data || response.data.status !== "success") {
      throw new AppError(
        response.data?.message || "Payment initialization failed",
        400
      );
    }

    return {
      paymentLink: response.data.data.link,
      tx_ref,
      status: response.data.status,
    };
  }

  // Vérifier une transaction
  // Dans src/services/payment.service.js
  async verifyPayment(tx_ref) {
    try {
      // OPTION A: Vérification par référence (tx_ref)
      const response = await axios.get(
        `${this.baseURL}/transactions/verify_by_reference?tx_ref=${tx_ref}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.data || response.data.status !== "success") {
        return {
          success: false,
          status: "error",
          message: response.data?.message || "Transaction verification failed",
        };
      }

      const transactionData = response.data.data;

      // Vérifier le statut du paiement
      if (transactionData.status !== "successful") {
        return {
          success: false,
          status: transactionData.status,
          message: `Transaction status: ${transactionData.status}`,
          data: transactionData,
        };
      }

      return {
        success: true,
        status: transactionData.status,
        data: transactionData,
      };
    } catch (error) {
      console.error(
        "Flutterwave verification error:",
        error.response?.data || error.message
      );

      // Si la transaction n'est pas trouvée (404), elle est probablement encore en attente
      if (error.response?.status === 404) {
        return {
          success: false,
          status: "pending",
          message: "Transaction not found or still processing",
          code: "TRANSACTION_NOT_FOUND",
        };
      }

      return {
        success: false,
        status: "error",
        message: error.response?.data?.message || error.message,
        code: error.response?.status?.toString(),
      };
    }
  }

  // Initier un transfert (retrait)
  async initiateTransfer({
    account_bank,
    account_number,
    amountInNaira,
    narration,
    currency = "NGN",
    reference,
    beneficiary_name,
  }) {
    const payload = {
      account_bank,
      account_number,
      amount: amountInNaira,
      narration,
      currency,
      reference: reference || this.generateReference("TRF"),
      beneficiary_name,
      callback_url: `${process.env.BACKEND_URL}/payments/webhook/transfer`,
    };

    const response = await axios.post(`${this.baseURL}/transfers`, payload, {
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.data || response.data.status !== "success") {
      throw new AppError(
        response.data?.message || "Transfer initiation failed",
        400
      );
    }

    return response.data;
  }

  // Valider la signature du webhook
  verifyWebhookSignature(payload, signature) {
    if (!this.webhookHash) {
      console.warn(
        "FLW_WEBHOOK_HASH is not set, skipping webhook verification"
      );
      return true;
    }

    return signature === this.webhookHash;
  }
}

export default new FlutterwaveService();
