import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    balance: {
      type: Number,
      default: 0, // en kobo
    },
    currency: {
      type: String,
      enum: ["NGN", "USD", "GHS"],
      default: "NGN",
    },

    escrowBalance: {
      type: Number,
      default: 0, // argent bloqué pour transactions
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
        },
        amount: Number,
        status: {
          type: String,
          enum: ["pending", "released", "cancelled"],
          default: "pending",
        },
        createdAt: { type: Date, default: Date.now },
        releasedAt: Date,
      },
    ],
  },
  { timestamps: true }
);

walletSchema.index({ user: 1 });
walletSchema.index({ status: 1 });
walletSchema.index({ createdAt: -1 });

walletSchema.methods.credit = function (amount) {
  this.balance += amount;
  return this.save();
};

walletSchema.methods.debit = function (amount) {
  if (this.balance < amount) throw new Error("Insufficient balance");
  this.balance -= amount;
  return this.save();
};

const Wallet = mongoose.model("Wallet", walletSchema);

export default Wallet;
