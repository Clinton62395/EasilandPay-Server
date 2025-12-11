import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  // User concerné
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },

  // Type de transaction
  type: {
    type: String,
    enum: {
      values: [
        "CREDIT", // Funding wallet (card, bank transfer)
        "DEBIT", // Withdrawal ou payment
        "COMMISSION", // Commission paid to realtor
        "REFUND", // Refund en cas d'annulation
      ],
      message: "{VALUE} is not a valid transaction type",
    },
    required: true,
  },

  // Montant en KOBO (toujours integer!)
  amountInKobo: {
    type: Number,
    required: true,
    validate: {
      validator: Number.isInteger,
      message: "Amount must be an integer (kobo)",
    },
  },

  // Reference unique (pour idempotency et tracking)
  // Format: TYPE_TIMESTAMP_USERID
  reference: {
    type: String,
    required: true,
    unique: true, // CRITIQUE: évite double-processing
    index: true,
  },

  // Statut de la transaction
  status: {
    type: String,
    enum: ["PENDING", "SUCCESS", "FAILED", "CANCELLED"],
    default: "PENDING",
    index: true,
  },

  // Balance du wallet APRÈS cette transaction
  // IMPORTANT pour audit trail
  balanceAfter: {
    type: Number,
  },

  // Description pour l'utilisateur
  description: {
    type: String,
    trim: true,
  },

  // Metadata flexible (stocker infos spécifiques)
  metadata: {
    // propertyId peut rester si lié à la transaction
    propertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: "Plan" },

    // payment gateway info
    paymentGateway: String,
    paymentMethod: String,
    gatewayReference: String,

    // withdrawals
    bankDetails: {
      accountNumber: String,
      bankName: String,
      accountName: String,
    },

    // commissions
    commissionPercentage: Number,
    originalTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
    },

    // timestamps et debug
    initiatedAt: Date,
    completedAt: Date,
    failedAt: Date,
    errorMessage: String,
    paystackResponse: mongoose.Schema.Types.Mixed,
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
});

// INDEX composites pour queries fréquentes
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, status: 1 });

// VIRTUAL: Montant en Naira
transactionSchema.virtual("amount").get(function () {
  return this.amountInKobo / 100;
});

// STATIC METHOD: Générer reference unique
transactionSchema.statics.generateReference = function (type, userId) {
  return `${type}_${Date.now()}_${userId}`;
};

// STATIC METHOD: Vérifier si reference existe (idempotency)
transactionSchema.statics.referenceExists = async function (reference) {
  const count = await this.countDocuments({ reference });
  return count > 0;
};

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
