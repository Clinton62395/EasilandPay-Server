import mongoose, { Schema } from "mongoose";

const planSchema = new mongoose.Schema(
  {
    // Plan name
    name: {
      type: String,
      required: [true, "Plan name is required"],
      unique: true,
      trim: true,
      minlength: [3, "Plan name must be at least 3 characters"],
      maxlength: [100, "Plan name cannot exceed 100 characters"],
    },

    // Plan description
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },

    // Minimum amount (in kobo)
    minAmount: {
      type: Number,
      required: [true, "Minimum amount is required"],
      default: 0,
      min: [0, "Minimum amount cannot be negative"],
    },

    // Maximum amount (in kobo)
    maxAmount: {
      type: Number,
      required: [true, "Maximum amount is required"],
      validate: {
        validator: function (value) {
          return value >= this.minAmount;
        },
        message:
          "Maximum amount must be greater than or equal to minimum amount",
      },
    },

    // Duration in days (not Date type)
    duration: {
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1 day"],
      max: [3650, "Duration cannot exceed 3650 days (10 years)"],
    },

    // Interest rate (percentage)
    interestRate: {
      type: Number,
      default: 0,
      min: [0, "Interest rate cannot be negative"],
      max: [100, "Interest rate cannot exceed 100%"],
    },

    // Plan type
    planType: {
      type: String,
      enum: {
        values: ["installment", "savings", "mortgage", "investment", "rental"],
        message: "{VALUE} is not a valid plan type",
      },
      required: [true, "Plan type is required"],
      default: "installment",
    },

    // Number of installments
    numberOfInstallments: {
      type: Number,
      min: [1, "Must have at least 1 installment"],
      max: [120, "Cannot exceed 120 installments"],
    },

    // Installment frequency
    installmentFrequency: {
      type: String,
      enum: ["daily", "weekly", "biweekly", "monthly", "quarterly", "yearly"],
      default: "monthly",
    },

    // Down payment percentage
    downPaymentPercentage: {
      type: Number,
      default: 0,
      min: [0, "Down payment percentage cannot be negative"],
      max: [100, "Down payment percentage cannot exceed 100%"],
    },

    // Late payment penalty percentage
    latePenaltyPercentage: {
      type: Number,
      default: 0,
      min: [0, "Late penalty percentage cannot be negative"],
      max: [50, "Late penalty percentage cannot exceed 50%"],
    },

    // Grace period in days
    gracePeriod: {
      type: Number,
      default: 0,
      min: [0, "Grace period cannot be negative"],
      max: [90, "Grace period cannot exceed 90 days"],
    },

    // Features/benefits array
    features: {
      type: [String],
      default: [],
    },

    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // Visibility
    isPublic: {
      type: Boolean,
      default: true,
    },

    // For specific user roles
    eligibleRoles: {
      type: [String],
      enum: ["buyer", "realtor", "company", "staff", "admin"],
      default: ["buyer"],
    },

    // Created by (admin/staff)
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    // Usage statistics
    totalSubscriptions: {
      type: Number,
      default: 0,
      min: 0,
    },

    activeSubscriptions: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// INDEXES
planSchema.index({ planType: 1, isActive: 1 });
planSchema.index({ minAmount: 1, maxAmount: 1 });

// VIRTUAL: Amount range in Naira
planSchema.virtual("amountRange").get(function () {
  return {
    min: this.minAmount / 100,
    max: this.maxAmount / 100,
  };
});

// VIRTUAL: Duration in months
planSchema.virtual("durationInMonths").get(function () {
  return Math.ceil(this.duration / 30);
});

// VIRTUAL: Duration in years
planSchema.virtual("durationInYears").get(function () {
  return (this.duration / 365).toFixed(2);
});

// VIRTUAL: Total interest amount (estimation)
planSchema.virtual("totalInterest").get(function () {
  if (this.interestRate > 0) {
    const principal = (this.minAmount + this.maxAmount) / 2; // Average
    return (principal * this.interestRate * (this.duration / 365)) / 100;
  }
  return 0;
});

// PRE-SAVE HOOK: Validate amount range
planSchema.pre("save", function (next) {
  if (this.maxAmount < this.minAmount) {
    return next(
      new Error(
        "Maximum amount must be greater than or equal to minimum amount"
      )
    );
  }
  next();
});

// PRE-SAVE HOOK: Calculate numberOfInstallments if not provided
planSchema.pre("save", function (next) {
  if (!this.numberOfInstallments) {
    // Calculate based on duration and frequency
    const frequencyDays = {
      daily: 1,
      weekly: 7,
      biweekly: 14,
      monthly: 30,
      quarterly: 90,
      yearly: 365,
    };

    const days = frequencyDays[this.installmentFrequency] || 30;
    this.numberOfInstallments = Math.ceil(this.duration / days);
  }
  next();
});

// METHOD: Check if amount is within plan range
planSchema.methods.isAmountValid = function (amountInKobo) {
  return amountInKobo >= this.minAmount && amountInKobo <= this.maxAmount;
};

// METHOD: Calculate installment amount
planSchema.methods.calculateInstallmentAmount = function (totalAmountInKobo) {
  if (!this.isAmountValid(totalAmountInKobo)) {
    throw new Error("Amount is outside plan range");
  }

  const downPayment = (totalAmountInKobo * this.downPaymentPercentage) / 100;
  const amountToFinance = totalAmountInKobo - downPayment;

  // Simple interest calculation
  const interest =
    (amountToFinance * this.interestRate * (this.duration / 365)) / 100;
  const totalWithInterest = amountToFinance + interest;

  return {
    downPaymentInKobo: Math.round(downPayment),
    downPayment: downPayment / 100,
    amountToFinanceInKobo: Math.round(amountToFinance),
    amountToFinance: amountToFinance / 100,
    totalInterestInKobo: Math.round(interest),
    totalInterest: interest / 100,
    totalAmountInKobo: Math.round(totalWithInterest),
    totalAmount: totalWithInterest / 100,
    installmentAmountInKobo: Math.round(
      totalWithInterest / this.numberOfInstallments
    ),
    installmentAmount: totalWithInterest / this.numberOfInstallments / 100,
    numberOfInstallments: this.numberOfInstallments,
  };
};

// METHOD: Increment subscription count
planSchema.methods.incrementSubscriptions = function () {
  this.totalSubscriptions += 1;
  this.activeSubscriptions += 1;
  return this.save();
};

// METHOD: Decrement active subscriptions
planSchema.methods.decrementActiveSubscriptions = function () {
  if (this.activeSubscriptions > 0) {
    this.activeSubscriptions -= 1;
    return this.save();
  }
};

// STATIC: Find active plans
planSchema.statics.findActive = function () {
  return this.find({ isActive: true, isPublic: true }).sort({ createdAt: -1 });
};

// STATIC: Find plans by type
planSchema.statics.findByType = function (planType) {
  return this.find({ planType, isActive: true }).sort({ minAmount: 1 });
};

// STATIC: Find plans for amount
planSchema.statics.findForAmount = function (amountInKobo) {
  return this.find({
    isActive: true,
    minAmount: { $lte: amountInKobo },
    maxAmount: { $gte: amountInKobo },
  }).sort({ duration: 1 });
};

const Plan = mongoose.model("Plan", planSchema);

export default Plan;
