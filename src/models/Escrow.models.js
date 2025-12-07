import mongoose from "mongoose";

const escrowSchema = new mongoose.Schema(
  {
    // Propriété concernée
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
      index: true,
    },

    // Buyer (acheteur)
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Realtor (agent - optionnel)
    realtorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // MONTANTS EN KOBO
    totalAmountInKobo: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Total amount must be an integer (kobo)",
      },
    },

    // Montant déjà payé par le buyer
    paidAmountInKobo: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Paid amount must be an integer (kobo)",
      },
    },

    // Montant actuellement locked dans escrow
    lockedAmountInKobo: {
      type: Number,
      default: 0,
      min: 0,
    },

    // STATUT DE L'ESCROW
    status: {
      type: String,
      enum: {
        values: [
          "CREATED", // Escrow créé, pas encore de paiement
          "ACTIVE", // Paiements en cours
          "COMPLETED", // Tout payé et released
          "DISPUTED", // Litige en cours
          "CANCELLED", // Annulé
          "REFUNDED", // Remboursé
        ],
        message: "{VALUE} is not a valid escrow status",
      },
      default: "CREATED",
      index: true,
    },

    // PAYMENT PLAN
    paymentPlan: {
      // Type de plan
      type: {
        type: String,
        enum: [
          "weekly",
          "monthly",
          "quarterly",
          "bi-annual",
          "yearly",
          "outright",
        ],
        required: true,
      },

      // Installments calculés
      installments: [
        {
          dueDate: {
            type: Date,
            required: true,
          },
          amountInKobo: {
            type: Number,
            required: true,
          },
          status: {
            type: String,
            enum: ["PENDING", "PAID", "OVERDUE", "SKIPPED"],
            default: "PENDING",
          },
          paidAt: Date,
          transactionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Transaction",
          },
        },
      ],

      // Calculé automatiquement
      totalInstallments: Number,
      paidInstallments: {
        type: Number,
        default: 0,
      },
    },

    // COMMISSION POUR LE REALTOR
    commission: {
      percentage: {
        type: Number,
        default: 5, // 5% par défaut
        min: 0,
        max: 100,
      },
      amountInKobo: Number, // Calculé: totalAmount * percentage
      paidToRealtor: {
        type: Boolean,
        default: false,
      },
      paidAt: Date,
      transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Transaction",
      },
    },

    // DISPUTE (pour MVP = manual handling)
    dispute: {
      active: {
        type: Boolean,
        default: false,
      },
      reason: String,
      initiatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      initiatedAt: Date,
      resolvedAt: Date,
      resolution: String,
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Admin
      },
    },

    // MILESTONES (optionnel pour MVP basic)
    milestones: [
      {
        name: String,
        percentage: Number, // % of total to release
        completed: {
          type: Boolean,
          default: false,
        },
        completedAt: Date,
        releasedAmountInKobo: Number,
      },
    ],
  },
  {
    // Timestamps
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// INDEX
escrowSchema.index({ buyerId: 1, status: 1 });
escrowSchema.index({ propertyId: 1 });
escrowSchema.index({ realtorId: 1 });
escrowSchema.index({ status: 1 });

// VIRTUAL: Montants en Naira
escrowSchema.virtual("totalAmount").get(function () {
  return this.totalAmountInKobo / 100;
});

escrowSchema.virtual("paidAmount").get(function () {
  return this.paidAmountInKobo / 100;
});

escrowSchema.virtual("remainingAmount").get(function () {
  return (this.totalAmountInKobo - this.paidAmountInKobo) / 100;
});

// VIRTUAL: Progress percentage
escrowSchema.virtual("progressPercentage").get(function () {
  if (this.totalAmountInKobo === 0) return 0;
  return Math.round((this.paidAmountInKobo / this.totalAmountInKobo) * 100);
});

// VIRTUAL: Next payment due
escrowSchema.virtual("nextPaymentDue").get(function () {
  const nextInstallment = this.paymentPlan.installments.find(
    (inst) => inst.status === "PENDING"
  );
  return nextInstallment
    ? {
        dueDate: nextInstallment.dueDate,
        amount: nextInstallment.amountInKobo / 100,
      }
    : null;
});

// PRE-SAVE: Calculate commission amount et update timestamp
escrowSchema.pre("save", function (next) {
  // Calculate commission si pas déjà fait
  if (!this.commission.amountInKobo && this.commission.percentage) {
    this.commission.amountInKobo = Math.round(
      (this.totalAmountInKobo * this.commission.percentage) / 100
    );
  }

  // Update total installments
  if (this.paymentPlan.installments) {
    this.paymentPlan.totalInstallments = this.paymentPlan.installments.length;
    this.paymentPlan.paidInstallments = this.paymentPlan.installments.filter(
      (inst) => inst.status === "PAID"
    ).length;
  }

  this.updatedAt = new Date();
  next();
});

// METHOD: Vérifier si escrow est fully paid
escrowSchema.methods.isFullyPaid = function () {
  return this.paidAmountInKobo >= this.totalAmountInKobo;
};

// METHOD: Initier un dispute
escrowSchema.methods.initiateDispute = function (userId, reason) {
  this.status = "DISPUTED";
  this.dispute = {
    active: true,
    reason,
    initiatedBy: userId,
    initiatedAt: new Date(),
  };
  return this.save();
};

const Escrow = mongoose.model("Escrow", escrowSchema);

export default Escrow;
