import mongoose from "mongoose";

const commissionSchema = new mongoose.Schema(
  {
    // Realtor qui reçoit la commission
    realtorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Escrow source de la commission
    escrowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Escrow",
      required: true,
    },

    // Propriété vendue
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },

    // Buyer
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // MONTANTS EN KOBO
    // Total commission gagné
    totalCommissionInKobo: {
      type: Number,
      required: true,
      min: 0,
    },

    // Commission déjà payée au realtor
    paidCommissionInKobo: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Percentage de commission (pour référence)
    commissionPercentage: {
      type: Number,
      required: true,
    },

    // STATUT
    status: {
      type: String,
      enum: ["PENDING", "PARTIAL", "PAID", "CANCELLED"],
      default: "PENDING",
      index: true,
    },

    // WITHDRAWAL REQUEST (pour MVP basic)
    withdrawalRequests: [
      {
        amountInKobo: Number,
        requestedAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["PENDING", "APPROVED", "REJECTED", "PROCESSED"],
          default: "PENDING",
        },
        approvedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User", // Admin
        },
        approvedAt: Date,
        processedAt: Date,
        transactionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Transaction",
        },
        rejectionReason: String,
      },
    ],

    // Transactions de paiement de commission
    paymentTransactions: [
      {
        transactionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Transaction",
        },
        amountInKobo: Number,
        paidAt: Date,
      },
    ],

    // Timestamps
  },
  { timestamps: true }
);

// INDEX
commissionSchema.index({ realtorId: 1, status: 1 });
commissionSchema.index({ escrowId: 1 });

// VIRTUAL: Montants en Naira
commissionSchema.virtual("totalCommission").get(function () {
  return this.totalCommissionInKobo / 100;
});

commissionSchema.virtual("paidCommission").get(function () {
  return this.paidCommissionInKobo / 100;
});

commissionSchema.virtual("pendingCommission").get(function () {
  return (this.totalCommissionInKobo - this.paidCommissionInKobo) / 100;
});

// PRE-SAVE: Update timestamp
commissionSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// METHOD: Request withdrawal
commissionSchema.methods.requestWithdrawal = function (amountInKobo) {
  const pending = this.totalCommissionInKobo - this.paidCommissionInKobo;

  if (amountInKobo > pending) {
    throw new Error("Withdrawal amount exceeds available commission");
  }

  this.withdrawalRequests.push({
    amountInKobo,
    requestedAt: new Date(),
    status: "PENDING",
  });

  return this.save();
};

const Commission = mongoose.model("Commission", commissionSchema);

export default Commission;
