import mongoose from "mongoose";

// models/EscrowAccount.js
const escrowAccountSchema = new mongoose.Schema({
  // **UNIQUE IDENTIFIER**
  escrowId: {
    type: String,
    unique: true,
    required: true,
    default: () =>
      `ESCROW_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  },

  // **THE TRIANGLE**
  propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true },
  buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  realtorId: { type: Schema.Types.ObjectId, ref: "User" },

  // **PLAN & MILESTONE**
  paymentPlanId: {
    type: Schema.Types.ObjectId,
    ref: "Plan",
    required: true,
  },
  currentMilestoneIndex: { type: Number, default: 0 },

  // **FINANCES**
  totalAmount: { type: Number, required: true }, // Total property price
  amountHeld: { type: Number, default: 0 }, // Currently in escrow
  amountReleasedToSeller: { type: Number, default: 0 },
  amountReleasedToRealtor: { type: Number, default: 0 },
  amountRefundedToBuyer: { type: Number, default: 0 },

  // **COMMISSION**
  commissionPercentage: { type: Number, default: 5 },

  // **MILESTONE TRACKING**
  milestones: [
    {
      name: String,
      amount: Number,
      status: {
        type: String,
        enum: ["PENDING", "FUNDED", "RELEASED", "CANCELLED"],
        default: "PENDING",
      },
      fundedAt: Date,
      releasedAt: Date,
      recipient: { type: String, enum: ["SELLER", "REALTOR"] },
    },
  ],

  // **STATUS**
  status: {
    type: String,
    enum: ["CREATED", "ACTIVE", "COMPLETED", "CANCELLED", "DISPUTED"],
    default: "CREATED",
  },

  // **DATES**
  createdAt: { type: Date, default: Date.now },
  completedAt: Date,
  cancelledAt: Date,
});

// **CRITICAL METHODS FOR ESCROW WORKFLOW**
escrowAccountSchema.methods.fundMilestone = async function (
  amount,
  milestoneIndex
) {
  if (this.status !== "ACTIVE" && this.status !== "CREATED") {
    throw new Error(`Cannot fund, escrow is ${this.status}`);
  }

  if (milestoneIndex >= this.milestones.length) {
    throw new Error("Invalid milestone index");
  }

  const milestone = this.milestones[milestoneIndex];
  if (milestone.status !== "PENDING") {
    throw new Error(`Milestone already ${milestone.status}`);
  }

  // Update milestone
  milestone.status = "FUNDED";
  milestone.fundedAt = new Date();

  // Update totals
  this.amountHeld += amount;
  this.currentMilestoneIndex = milestoneIndex;

  if (this.status === "CREATED") {
    this.status = "ACTIVE";
  }

  return this.save();
};

escrowAccountSchema.methods.releaseMilestone = async function (
  milestoneIndex,
  recipient = "SELLER"
) {
  const milestone = this.milestones[milestoneIndex];

  if (milestone.status !== "FUNDED") {
    throw new Error(`Milestone not funded (status: ${milestone.status})`);
  }

  // Calculate commission if releasing to seller
  let amountToRelease = milestone.amount;
  let commissionAmount = 0;

  if (recipient === "SELLER" && this.realtorId) {
    commissionAmount = milestone.amount * (this.commissionPercentage / 100);
    amountToRelease = milestone.amount - commissionAmount;

    // Track commission
    this.amountReleasedToRealtor += commissionAmount;
  }

  // Update milestone
  milestone.status = "RELEASED";
  milestone.releasedAt = new Date();
  milestone.recipient = recipient;

  // Update totals
  this.amountHeld -= milestone.amount;

  if (recipient === "SELLER") {
    this.amountReleasedToSeller += amountToRelease;
  }

  // Check if all milestones are released
  const allReleased = this.milestones.every((m) => m.status === "RELEASED");
  if (allReleased) {
    this.status = "COMPLETED";
    this.completedAt = new Date();
  }

  return this.save();
};

escrowAccountSchema.methods.refundToBuyer = async function (amount, reason) {
  if (this.amountHeld < amount) {
    throw new Error("Insufficient funds in escrow");
  }

  this.amountHeld -= amount;
  this.amountRefundedToBuyer += amount;
  this.status = "CANCELLED";
  this.cancelledAt = new Date();

  return this.save();
};

// Static methods
escrowAccountSchema.statics.createForTransaction = async function (data) {
  const {
    propertyId,
    buyerId,
    sellerId,
    realtorId,
    paymentPlanId,
    totalAmount,
  } = data;

  // Get payment plan to create milestones
  const paymentPlan = await PropertyPaymentPlan.findById(paymentPlanId);

  const escrowAccount = new this({
    propertyId,
    buyerId,
    sellerId,
    realtorId,
    paymentPlanId,
    totalAmount,
    milestones: paymentPlan.milestones.map((m) => ({
      name: m.name,
      amount: m.amount,
      status: "PENDING",
    })),
  });

  return escrowAccount.save();
};

const Escrow = mongoose.model("Escrow", escrowAccountSchema);
export default Escrow;
