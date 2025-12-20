import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Important: un wallet par user
    },

    balance: {
      type: Number,
      default: 0,
      min: 0, // Empêcher les soldes négatifs
      validate: {
        validator: Number.isInteger,
        message: "Balance must be an integer (kobo)",
      },
    },

    escrowBalance: {
      type: Number,
      default: 0,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Escrow balance must be an integer (kobo)",
      },
    },

    currency: {
      type: String,
      enum: ["NGN", "USD", "EUR", "GBP"],
      default: "NGN",
    },

    totalDeposits: {
      type: Number,
      default: 0,
    },

    totalWithdrawals: {
      type: Number,
      default: 0,
    },

    totalEscrowReleased: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    transactions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Transaction",
      },
    ],

    escrowHistory: [
      {
        property: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Property",
          required: true,
        },
        transaction: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Transaction",
        },
        amount: {
          type: Number,
          required: true,
          min: 100, // Minimum 1 NGN
        },
        status: {
          type: String,
          enum: ["PENDING", "RELEASED", "CANCELLED", "REFUNDED"],
          default: "PENDING",
        },
        description: String,
        metadata: {
          buyerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          realtorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
          },
          contractId: String,
          commissionPercentage: Number,
        },
        createdAt: { type: Date, default: Date.now },
        updatedAt: Date,
        releasedAt: Date,
        cancelledAt: Date,
        cancellationReason: String,
      },
    ],

    lastTransactionAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes corrigés
walletSchema.index({ user: 1 });
walletSchema.index({ createdAt: -1 });
walletSchema.index({ isActive: 1 });
walletSchema.index({ balance: -1 });
walletSchema.index({ "escrowHistory.property": 1 });
walletSchema.index({ "escrowHistory.status": 1 });

// Virtuals
walletSchema.virtual("totalBalance").get(function () {
  return this.balance + this.escrowBalance;
});

walletSchema.virtual("availableBalance").get(function () {
  return this.balance;
});

walletSchema.virtual("balanceInNaira").get(function () {
  return this.balance / 100;
});

walletSchema.virtual("escrowBalanceInNaira").get(function () {
  return this.escrowBalance / 100;
});

// Pre-save middleware pour mettre à jour lastTransactionAt
walletSchema.pre("save", function (next) {
  if (this.isModified("balance") || this.isModified("escrowBalance")) {
    this.lastTransactionAt = new Date();
  }
  next();
});

// Méthode pour vérifier si le débit est possible
walletSchema.methods.canDebit = function (amount) {
  return this.balance >= amount;
};

walletSchema.methods.canMoveToEscrow = function (amount) {
  return this.balance >= amount;
};

// Méthode crédit améliorée
walletSchema.methods.credit = async function (amount, description = "Credit") {
  if (amount <= 0) {
    throw new Error("Credit amount must be positive");
  }

  this.balance += amount;
  this.totalDeposits += amount;
  this.lastTransactionAt = new Date();

  return await this.save();
};

// Méthode débit améliorée avec validation
walletSchema.methods.debit = async function (amount, description = "Debit") {
  if (amount <= 0) {
    throw new Error("Debit amount must be positive");
  }

  if (!this.canDebit(amount)) {
    throw new Error("Insufficient balance");
  }

  this.balance -= amount;
  this.totalWithdrawals += amount;
  this.lastTransactionAt = new Date();

  return await this.save();
};

// Méthode pour mettre en escrow
walletSchema.methods.moveToEscrow = async function (
  amount,
  propertyId,
  transactionId,
  description = "Escrow hold"
) {
  if (amount <= 0) {
    throw new Error("Escrow amount must be positive");
  }

  if (!this.canMoveToEscrow(amount)) {
    throw new Error("Insufficient balance for escrow");
  }

  // Débiter le solde disponible
  this.balance -= amount;
  this.escrowBalance += amount;

  // Ajouter à l'historique escrow
  this.escrowHistory.push({
    property: propertyId,
    transaction: transactionId,
    amount: amount,
    status: "PENDING",
    description: description,
    createdAt: new Date(),
  });

  this.lastTransactionAt = new Date();

  return await this.save();
};

// Méthode pour libérer l'escrow
walletSchema.methods.releaseEscrow = async function (
  escrowEntryId,
  recipientType = "SELLER", // ou "BUYER" pour remboursement
  description = "Escrow release"
) {
  const escrowEntry = this.escrowHistory.id(escrowEntryId);

  if (!escrowEntry) {
    throw new Error("Escrow entry not found");
  }

  if (escrowEntry.status !== "PENDING") {
    throw new Error(`Escrow already ${escrowEntry.status.toLowerCase()}`);
  }

  // Mettre à jour le statut
  escrowEntry.status = "RELEASED";
  escrowEntry.releasedAt = new Date();
  escrowEntry.updatedAt = new Date();
  escrowEntry.description = description;

  // Retirer du solde escrow
  this.escrowBalance -= escrowEntry.amount;
  this.totalEscrowReleased += escrowEntry.amount;

  // Si c'est pour le vendeur, créditer le solde (ou gérer autrement)
  // Note: Cette logique dépend de votre système de paiement
  if (recipientType === "SELLER") {
    // Dans un vrai système, vous transféreriez au vendeur
    // Pour l'instant, on garde juste l'historique
  }

  this.lastTransactionAt = new Date();

  return await this.save();
};

// Méthode pour annuler l'escrow (remboursement)
walletSchema.methods.cancelEscrow = async function (
  escrowEntryId,
  reason = "Cancelled by buyer"
) {
  const escrowEntry = this.escrowHistory.id(escrowEntryId);

  if (!escrowEntry) {
    throw new Error("Escrow entry not found");
  }

  if (escrowEntry.status !== "PENDING") {
    throw new Error(
      `Cannot cancel, escrow is ${escrowEntry.status.toLowerCase()}`
    );
  }

  // Mettre à jour le statut
  escrowEntry.status = "CANCELLED";
  escrowEntry.cancelledAt = new Date();
  escrowEntry.updatedAt = new Date();
  escrowEntry.cancellationReason = reason;

  // Rembourser au solde disponible
  this.escrowBalance -= escrowEntry.amount;
  this.balance += escrowEntry.amount; // Remboursement

  this.lastTransactionAt = new Date();

  return await this.save();
};

// Méthode statique pour trouver le wallet d'un utilisateur
walletSchema.statics.findByUserId = async function (userId) {
  return await this.findOne({ user: userId });
};

// Méthode pour calculer le total en attente d'escrow par propriété
walletSchema.methods.getEscrowForProperty = function (propertyId) {
  return this.escrowHistory
    .filter(
      (entry) =>
        entry.property.toString() === propertyId.toString() &&
        entry.status === "PENDING"
    )
    .reduce((total, entry) => total + entry.amount, 0);
};

const Wallet = mongoose.model("Wallet", walletSchema);

export default Wallet;
