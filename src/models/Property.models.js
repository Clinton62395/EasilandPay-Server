import mongoose, { Schema } from "mongoose";

// models/Property.js
const propertySchema = new mongoose.Schema(
  {
    // Basic info
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true }, // In kobo

    // Location
    location: {
      state: { type: String, required: true },
      city: { type: String, required: true },
      address: { type: String, required: true },
    },

    // Property details
    details: {
      propertyType: {
        type: String,
        enum: ["APARTMENT", "HOUSE", "LAND", "COMMERCIAL"],
        required: true,
      },
      bedrooms: { type: Number, default: 0 },
      bathrooms: { type: Number, default: 0 },
    },

    // Images
    images: [
      {
        url: { type: String, required: true },
        isPrimary: { type: Boolean, default: false },
      },
    ],

    // **CRITICAL FOR EASILANDPAY**
    // Payment plans for THIS property
    paymentPlans: [
      {
        type: Schema.Types.ObjectId,
        ref: "Plan",
      },
    ],

    // Current transaction (if any)
    currentTransaction: {
      buyerId: { type: Schema.Types.ObjectId, ref: "User" },
      paymentPlanId: {
        type: Schema.Types.ObjectId,
        ref: "PropertyPaymentPlan",
      },
      escrowAccountId: { type: Schema.Types.ObjectId, ref: "EscrowAccount" },
      amountPaid: { type: Number, default: 0 },
      completionPercentage: { type: Number, default: 0 },
    },

    // Status
    status: {
      type: String,
      enum: [
        "DRAFT",
        "PENDING_APPROVAL",
        "AVAILABLE",
        "RESERVED",
        "SOLD",
        "SUSPENDED",
      ],
      default: "DRAFT",
    },

    // Ownership
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true }, // Realtor
    assignedRealtorId: { type: Schema.Types.ObjectId, ref: "User" }, // Same as owner usually

    // Commission
    commissionPercentage: { type: Number, default: 5, min: 0, max: 100 },

    // Admin approval
    isApproved: { type: Boolean, default: false },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: Date,

    // Stats
    viewsCount: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Methods
propertySchema.methods.addPaymentPlan = async function (planId) {
  this.paymentPlans.push(planId);
  return this.save();
};

propertySchema.methods.reserveForBuyer = async function (
  buyerId,
  paymentPlanId
) {
  this.status = "RESERVED";
  this.currentTransaction.buyerId = buyerId;
  this.currentTransaction.paymentPlanId = paymentPlanId;
  return this.save();
};

propertySchema.methods.updatePaymentProgress = async function (amountPaid) {
  this.currentTransaction.amountPaid += amountPaid;
  this.currentTransaction.completionPercentage =
    (this.currentTransaction.amountPaid / this.price) * 100;

  if (this.currentTransaction.completionPercentage >= 100) {
    this.status = "SOLD";
  }

  return this.save();
};

const Property = mongoose.model("Properties", propertySchema);

export default Property;
