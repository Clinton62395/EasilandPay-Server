import mongoose, { Schema } from "mongoose";

// models/Wallet.js
const walletSchema = new mongoose.Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
      validate: { validator: Number.isInteger },
    },

    currency: { type: String, default: "NGN" },
    totalDeposited: { type: Number, default: 0 },
    totalWithdrawn: { type: Number, default: 0 },

    // Historique simplifié
    lastTransactionAt: Date,

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Virtuals
walletSchema.virtual("balanceInNaira").get(function () {
  return this.balance / 100;
});

// Compatibilité : `balanceInKobo` (utilisé par les services)
walletSchema
  .virtual("balanceInKobo")
  .get(function () {
    return this.balance;
  })
  .set(function (val) {
    this.balance = val;
  });

// Méthodes
walletSchema.methods.canDebit = function (amount) {
  return this.balance >= amount;
};

walletSchema.methods.debit = async function (amount, description) {
  if (!this.canDebit(amount)) throw new Error("Insufficient balance");
  this.balance -= amount;
  this.totalWithdrawn += amount;
  this.lastTransactionAt = new Date();
  return this.save();
};

walletSchema.methods.credit = async function (amount, description) {
  this.balance += amount;
  this.totalDeposited += amount;
  this.lastTransactionAt = new Date();
  return this.save();
};

const Wallet = mongoose.model("Wallet", walletSchema);

export default Wallet;
