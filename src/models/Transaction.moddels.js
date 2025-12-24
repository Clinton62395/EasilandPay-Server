import mongoose from "mongoose";

// models/Transaction.js
const transactionSchema = new mongoose.Schema({
  // **USER CONCERNÉ**
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },

  // **TYPE DE TRANSACTION - ADAPTÉ POUR EASILANDPAY**
  type: {
    type: String,
    enum: {
      values: [
        // WALLET OPERATIONS
        "WALLET_DEPOSIT", // Rechargement du wallet
        "WALLET_WITHDRAWAL", // Retrait du wallet

        // **ESCROW OPERATIONS (NOUVEAUX)**
        "ESCROW_DEPOSIT", // Buyer → Escrow (payer un milestone)
        "ESCROW_RELEASE_SELLER", // Escrow → Seller (libération vendeur)
        "ESCROW_RELEASE_REALTOR", // Escrow → Realtor (commission)
        "ESCROW_REFUND", // Escrow → Buyer (remboursement)

        // COMMISSIONS
        "COMMISSION_PAYMENT", // Paiement de commission

        // FEES
        "PLATFORM_FEE", // Frais de plateforme
        "PROCESSING_FEE", // Frais de traitement
      ],
      message: "{VALUE} is not a valid transaction type",
    },
    required: true,
    index: true,
  },

  // **MONTANT EN KOBO**
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

  // **RÉFÉRENCES - AJOUT ESCROW**
  reference: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },

  // **LIENS CRITIQUES POUR EASILANDPAY**
  // (Certains sont optionnels selon le type)

  // Pour transactions liées à une propriété
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Property",
    index: true,
  },

  // **NOUVEAU : Lien avec EscrowAccount**
  escrowAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "EscrowAccount",
    index: true,
  },

  // Pour transactions liées à un plan de paiement
  paymentPlanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "PropertyPaymentPlan",
    index: true,
  },

  // Pour suivre les milestones
  milestoneIndex: {
    type: Number,
    min: 0,
  },

  // **STATUT**
  status: {
    type: String,
    enum: ["PENDING", "SUCCESS", "FAILED", "CANCELLED"],
    default: "PENDING",
    index: true,
  },

  // **BALANCE DU WALLET APRÈS**
  balanceAfter: {
    type: Number,
  },

  // **DESCRIPTION**
  description: {
    type: String,
    trim: true,
  },

  // **FEES - DÉTAILLÉES POUR EASILANDPAY**
  fees: {
    processingFee: { type: Number, default: 0 },
    gatewayFee: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 },
    totalFees: { type: Number, default: 0 },
  },

  // **MONTANT NET (après frais)**
  netAmountInKobo: {
    type: Number,
  },

  // **METADATA ADAPTÉ**
  metadata: {
    // Payment gateway
    paymentGateway: {
      type: String,
      enum: ["PAYSTACK", "FLUTTERWAVE", "STRIPE", "BANK_TRANSFER", "WALLET"],
    },
    paymentMethod: String,
    gatewayReference: String,
    gatewayResponse: mongoose.Schema.Types.Mixed,

    // Pour withdrawals
    bankDetails: {
      accountNumber: String,
      bankName: String,
      accountName: String,
      bankCode: String,
    },

    // **POUR ESCROW**
    escrowDetails: {
      milestoneName: String,
      propertyTitle: String,
      buyerName: String,
      sellerName: String,
      realtorName: String,
      commissionPercentage: Number,
      commissionAmount: Number,
    },

    // Pour commissions
    commissionDetails: {
      fromTransactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Transaction",
      },
      fromPropertyId: { type: mongoose.Schema.Types.ObjectId, ref: "Property" },
      percentage: Number,
    },

    // Debug et audit
    initiatedAt: { type: Date, default: Date.now },
    completedAt: Date,
    failedAt: Date,
    cancelledAt: Date,
    errorMessage: String,
    ipAddress: String,
    userAgent: String,

    // Remboursements
    refundReason: String,
    refundedTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
    },
  },

  // **RELATED TRANSACTIONS**
  // Pour lier les transactions entre elles
  relatedTransactions: [
    {
      transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Transaction",
      },
      relationship: {
        type: String,
        enum: [
          "COMMISSION_FROM",
          "REFUND_OF",
          "ESCROW_RELEASE",
          "SPLIT_PAYMENT",
        ],
      },
    },
  ],

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// **INDEXES**
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ userId: 1, type: 1, status: 1 });
transactionSchema.index({ propertyId: 1, type: 1 });
transactionSchema.index({ escrowAccountId: 1 });
transactionSchema.index({ reference: 1 });
transactionSchema.index({
  "metadata.paymentGateway": 1,
  "metadata.gatewayReference": 1,
});
transactionSchema.index({ type: 1, status: 1, createdAt: -1 });

// **VIRTUALS**
transactionSchema.virtual("amount").get(function () {
  return this.amountInKobo / 100;
});

transactionSchema.virtual("netAmount").get(function () {
  return this.netAmountInKobo ? this.netAmountInKobo / 100 : this.amount;
});

// **PRE-SAVE MIDDLEWARE**
transactionSchema.pre("save", function (next) {
  this.updatedAt = new Date();

  // Calculer netAmount si amount et fees existent
  if (this.amountInKobo && this.fees.totalFees !== undefined) {
    this.netAmountInKobo = this.amountInKobo - this.fees.totalFees;
  }

  next();
});

// **STATIC METHODS**
transactionSchema.statics.generateReference = function (type, userId) {
  const random = Math.floor(Math.random() * 10000);
  const prefix = type.toUpperCase().substring(0, 4);
  return `${prefix}_${Date.now()}_${userId}_${random}`;
};

transactionSchema.statics.referenceExists = async function (reference) {
  const count = await this.countDocuments({ reference });
  return count > 0;
};

// **METHODS SPÉCIFIQUES EASILANDPAY**
transactionSchema.methods.markAsSuccess = function (
  balanceAfter = null,
  gatewayResponse = null
) {
  this.status = "SUCCESS";
  if (balanceAfter !== null) this.balanceAfter = balanceAfter;
  this.metadata.completedAt = new Date();
  if (gatewayResponse) {
    this.metadata.gatewayResponse = gatewayResponse;
  }
  return this.save();
};

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

transactionSchema.methods.cancel = function (reason) {
  this.status = "CANCELLED";
  this.metadata.cancelledAt = new Date();
  this.metadata.cancellationReason = reason;
  return this.save();
};

// **NOUVELLE MÉTHODE : Lier à une autre transaction**
transactionSchema.methods.addRelatedTransaction = function (
  transactionId,
  relationship
) {
  this.relatedTransactions.push({
    transactionId: transactionId,
    relationship: relationship,
  });
  return this.save();
};

// **NOUVELLE MÉTHODE : Pour les transactions escrow**
transactionSchema.methods.getEscrowDetails = function () {
  if (!this.escrowAccountId) return null;

  return {
    escrowAccountId: this.escrowAccountId,
    milestoneIndex: this.milestoneIndex,
    propertyId: this.propertyId,
    type: this.type,
  };
};

// **NOUVELLE MÉTHODE : Calculer la commission automatiquement**
transactionSchema.methods.calculateCommission = function (percentage = 5) {
  if (this.type !== "ESCROW_DEPOSIT") return 0;

  const commission = Math.round(this.amountInKobo * (percentage / 100));
  return commission;
};

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;
