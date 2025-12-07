import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    // Un wallet par utilisateur (relation 1:1)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Un seul wallet par user
    },

    // Balance en KOBO (jamais en Naira float!)
    // 1 Naira = 100 Kobo
    balanceInKobo: {
      type: Number,
      default: 0,
      min: [0, "Balance cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Balance must be an integer (kobo)",
      },
    },

    // Montant locked dans escrow (ne peut pas être utilisé)
    lockedInKobo: {
      type: Number,
      default: 0,
      min: [0, "Locked amount cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Locked amount must be an integer (kobo)",
      },
    },

    // Dedicated virtual account Paystack (pour bank transfers)
    dedicatedAccount: {
      account_number: String,
      account_name: String,
      bank_name: String,
      customer_code: String, // Paystack customer code
      assigned: {
        type: Boolean,
        default: false,
      },
      assignedAt: Date,
    },

    // Historique des dernières opérations (cache pour performance)
    lastTransactions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Transaction",
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// INDEX
walletSchema.index({ userId: 1 });

// VIRTUAL: Balance disponible (balance - locked)
walletSchema.virtual("availableBalanceInKobo").get(function () {
  return this.balanceInKobo - this.lockedInKobo;
});

// VIRTUAL: Balance en Naira (pour affichage)
walletSchema.virtual("balance").get(function () {
  return this.balanceInKobo / 100;
});

walletSchema.virtual("locked").get(function () {
  return this.lockedInKobo / 100;
});

walletSchema.virtual("availableBalance").get(function () {
  return this.availableBalanceInKobo / 100;
});

// PRE-SAVE: Update timestamp
walletSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// METHOD: Vérifier si le wallet a assez de fonds disponibles
walletSchema.methods.hasSufficientBalance = function (amountInKobo) {
  return this.availableBalanceInKobo >= amountInKobo;
};

// STATIC METHOD: Créer wallet pour un nouveau user
walletSchema.statics.createForUser = async function (userId) {
  return await this.create({ userId, balanceInKobo: 0, lockedInKobo: 0 });
};

const Wallet = mongoose.model("Wallet", walletSchema);

export default Wallet
