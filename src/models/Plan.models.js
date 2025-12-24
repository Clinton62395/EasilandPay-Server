import mongoose, { mongo, Schema } from "mongoose";

// models/PropertyPaymentPlan.js
const propertyPaymentPlanSchema = new mongoose.Schema(
  {
    // **LINK TO PROPERTY**
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },

    // Basic info
    name: { type: String, required: true }, // "Plan 12 mois - Villa Lagos"
    description: String,

    // Financial
    totalAmount: { type: Number, required: true }, // Same as property price
    downPayment: {
      amount: Number,
      percentage: { type: Number, min: 0, max: 100 },
    },

    // **CRITICAL: MILESTONES FOR ESCROW**
    milestones: [
      {
        name: { type: String, required: true }, // "Acompte", "Fin fondations"
        description: String,
        amount: { type: Number, required: true },
        percentage: { type: Number, min: 0, max: 100 },
        order: { type: Number, required: true },
        triggerType: {
          type: String,
          enum: ["ON_SIGNATURE", "ON_CONSTRUCTION", "FIXED_DATE"],
          default: "ON_SIGNATURE",
        },
        estimatedDate: Date,
      },
    ],

    // Duration
    durationMonths: { type: Number, required: true, min: 1 },

    // **APPROVAL WORKFLOW**
    status: {
      type: String,
      enum: [
        "DRAFT",
        "PENDING_APPROVAL",
        "APPROVED",
        "REJECTED",
        "ACTIVE",
        "INACTIVE",
      ],
      default: "DRAFT",
    },

    // Creator (Realtor)
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Admin approval
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedAt: Date,
    rejectionReason: String,

    // Usage
    isDefault: { type: Boolean, default: false },
    usageCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Validation: Total milestones = 100%
propertyPaymentPlanSchema.pre("save", function (next) {
  if (this.milestones && this.milestones.length > 0) {
    const totalPercent = this.milestones.reduce(
      (sum, m) => sum + m.percentage,
      0
    );
    if (Math.abs(totalPercent - 100) > 0.01) {
      return next(new Error("Sum of milestone percentages must equal 100%"));
    }
  }
  next();
});

// Methods
propertyPaymentPlanSchema.methods.getNextMilestone = function () {
  return this.milestones.find((m) => m.status === "PENDING");
};

const Plan = mongoose.model("PaymentPlan", propertyPaymentPlanSchema);
export default Plan;
