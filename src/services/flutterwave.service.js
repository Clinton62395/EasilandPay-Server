import axios from "axios";
import { AppError } from "../utils/appError.utils.js";
import { catchAsynch } from "../utils/catchAsynch.utils.js";
import dotenv from "dotenv";

dotenv.config();

class FlutterwaveService {
  constructor() {
    this.baseURL = "https://api.flutterwave.com/v3";
    this.secretKey = process.env.FLW_SCRETE_KEY;
    this.publicKey = process.env.FLW_PUBLIC_KEY;
    this.encryptionKey = process.env.FLW_ENCRYPTION_KEY;
    this.webhookHash = process.env.FLW_WEBHOOK_HASH;
  }

  // Générer une référence unique pour Flutterwave
  generateReference(prefix = "EASILAND") {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `${prefix}_${timestamp}_${random}`;
  }

  // Initialiser un paiement
  initializePayment = catchAsynch(
    async ({
      amountInNaira,
      email,
      userId,
      currency = "NGN",
      redirectUrl,
      meta = {},
    }) => {
      const tx_ref = this.generateReference("FLW");

      const payload = {
        tx_ref,
        amount: amountInNaira,
        currency,
        redirect_url: redirectUrl,
        customer: {
          email,
          name: `User_${userId}`,
        },
        customizations: {
          title: "EasilandPay",
          description: "Wallet Funding",
          logo: "https://easilandpay.com/logo.png",
        },
        meta: {
          ...meta,
          userId,
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
  );

  // Vérifier une transaction
  verifyPayment = catchAsynch(async (transactionId) => {
    const response = await axios.get(
      `${this.baseURL}/transactions/${transactionId}/verify`,
      {
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
        },
      }
    );

    if (!response.data || response.data.status !== "success") {
      throw new AppError(
        response.data?.message || "Transaction verification failed",
        400
      );
    }

    return response.data;
  });

  // Initier un transfert (retrait)
  initiateTransfer = catchAsynch(
    async ({
      account_bank,
      account_number,
      amountInNaira,
      narration,
      currency = "NGN",
      reference,
      beneficiary_name,
    }) => {
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
  );

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
