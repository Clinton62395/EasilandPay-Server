import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    balance: {
      type: Number,
      default: 0, // en kobo
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
const Wallet = mongoose.model("Wallet", walletSchema);

export default Wallet;
