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
      validator: function (value) {
        return Number.isInteger(value) && value > 0;
      },
      message: "Amount must be a positive integer (in kobo)",
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
  // Dans le schéma, ajouter :
  fees: {
    processingFee: { type: Number, default: 0 }, // Frais de traitement
    gatewayFee: { type: Number, default: 0 }, // Frais de la passerelle
    totalFees: { type: Number, default: 0 }, // Total des frais
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
  const random = Math.floor(Math.random() * 10000); // 4 chiffres aléatoires
  return `${type}_${Date.now()}_${userId}_${random}`;
};

// Méthode pour marquer comme succès
transactionSchema.methods.markAsSuccess = function (
  balanceAfter,
  gatewayResponse = null
) {
  this.status = "SUCCESS";
  this.balanceAfter = balanceAfter;
  this.metadata.completedAt = new Date();
  if (gatewayResponse) {
    this.metadata.gatewayResponse = gatewayResponse;
  }
  return this.save();
};

// Méthode pour marquer comme échoué
transactionSchema.methods.markAsFailed = function (
  errorMessage,
  gatewayResponse = null
) {
  this.status = "FAILED";
  this.metadata.failedAt = new Date();
  this.metadata.errorMessage = errorMessage;
  if (gatewayResponse) {
    this.metadata.gatewayResponse = gatewayResponse;
  }
  return this.save();
};

// Méthode pour annuler
transactionSchema.methods.cancel = function (reason) {
  this.status = "CANCELLED";
  this.metadata.cancelledAt = new Date();
  this.metadata.cancellationReason = reason;
  return this.save();
};
// STATIC METHOD: Vérifier si reference existe (idempotency)
transactionSchema.statics.referenceExists = async function (reference) {
  const count = await this.countDocuments({ reference });
  return count > 0;
};

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
