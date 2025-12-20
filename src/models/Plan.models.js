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
      index: true,
    },

    // Plan description
    description: {
      type: String,
      trim: true,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },

    // Plan code (for reference)
    planCode: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
      match: [
        /^[A-Z0-9_]+$/,
        "Plan code can only contain letters, numbers and underscores",
      ],
    },

    // Amount range in kobo
    minAmountInKobo: {
      type: Number,
      required: [true, "Minimum amount is required"],
      min: [10000, "Minimum amount is 100 NGN (10000 kobo)"],
      validate: {
        validator: Number.isInteger,
        message: "Amount must be an integer (kobo)",
      },
    },

    maxAmountInKobo: {
      type: Number,
      required: [true, "Maximum amount is required"],
      validate: {
        validator: Number.isInteger,
        message: "Amount must be an integer (kobo)",
      },
    },

    // Duration
    durationMonths: {
      type: Number,
      required: true,
      min: [1, "Duration must be at least 1 month"],
      max: [360, "Duration cannot exceed 360 months (30 years)"],
    },

    // Interest
    interestRatePerAnnum: {
      type: Number,
      default: 0,
      min: [0, "Interest rate cannot be negative"],
      max: [100, "Interest rate cannot exceed 100%"],
    },

    interestType: {
      type: String,
      enum: ["SIMPLE", "COMPOUND", "REDUCING_BALANCE", "FLAT"],
      default: "REDUCING_BALANCE",
    },

    interestCompoundingFrequency: {
      type: String,
      enum: ["DAILY", "MONTHLY", "QUARTERLY", "ANNUALLY"],
      default: "MONTHLY",
    },

    // Plan type
    planType: {
      type: String,
      enum: [
        "INSTALLMENT",
        "SAVINGS",
        "MORTGAGE",
        "INVESTMENT",
        "RENTAL",
        "LEASE_TO_OWN",
        "RENT_TO_OWN",
      ],
      required: [true, "Plan type is required"],
      default: "INSTALLMENT",
      index: true,
    },

    // Installment configuration
    numberOfInstallments: {
      type: Number,
      min: [1, "Must have at least 1 installment"],
      max: [360, "Cannot exceed 360 installments"],
    },

    installmentFrequency: {
      type: String,
      enum: ["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "ANNUALLY"],
      default: "MONTHLY",
    },

    // Fees
    processingFeeInKobo: {
      type: Number,
      default: 0,
      min: 0,
    },

    processingFeePercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },

    administrationFeeInKobo: {
      type: Number,
      default: 0,
      min: 0,
    },

    insuranceFeeInKobo: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Down payment
    downPaymentPercentage: {
      type: Number,
      default: 0,
      min: [0, "Down payment percentage cannot be negative"],
      max: [100, "Down payment percentage cannot exceed 100%"],
    },

    minimumDownPaymentInKobo: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Late payment
    latePaymentPenaltyPercentage: {
      type: Number,
      default: 0,
      min: [0, "Late penalty percentage cannot be negative"],
      max: [50, "Late penalty percentage cannot exceed 50%"],
    },

    latePaymentPenaltyFixedInKobo: {
      type: Number,
      default: 0,
      min: 0,
    },

    gracePeriodDays: {
      type: Number,
      default: 7,
      min: [0, "Grace period cannot be negative"],
      max: [90, "Grace period cannot exceed 90 days"],
    },

    // Early settlement
    earlySettlementAllowed: {
      type: Boolean,
      default: true,
    },

    earlySettlementFeePercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },

    // Eligibility
    eligibleRoles: {
      type: [String],
      enum: ["BUYER", "REALTOR", "COMPANY", "STAFF", "ADMIN", "ALL"],
      default: ["BUYER"],
    },

    minimumCreditScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 850,
    },

    // Features
    features: [
      {
        title: String,
        description: String,
        icon: String,
      },
    ],

    requirements: [
      {
        type: String,
        enum: [
          "BANK_STATEMENT",
          "ID_CARD",
          "UTILITY_BILL",
          "EMPLOYMENT_LETTER",
          "TAX_CLEARANCE",
          "GUARANTOR",
        ],
      },
    ],

    // Status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isPublic: {
      type: Boolean,
      default: true,
      index: true,
    },

    isRecommended: {
      type: Boolean,
      default: false,
    },

    // Usage tracking
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

    successfulCompletions: {
      type: Number,
      default: 0,
      min: 0,
    },

    defaultRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    // Created by
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    approvedAt: Date,

    // Display order
    displayOrder: {
      type: Number,
      default: 0,
    },

    // SEO
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },

    metaTitle: String,
    metaDescription: String,

    // Audit trail
    lastUpdatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
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
planSchema.index({ minAmountInKobo: 1, maxAmountInKobo: 1 });
planSchema.index({ eligibleRoles: 1 });
planSchema.index({ isRecommended: 1 });
planSchema.index({ displayOrder: 1 });
planSchema.index({ createdAt: -1 });
planSchema.index({ slug: 1 });

// VIRTUAL FIELDS
planSchema.virtual("minAmount").get(function () {
  return this.minAmountInKobo / 100;
});

planSchema.virtual("maxAmount").get(function () {
  return this.maxAmountInKobo / 100;
});

planSchema.virtual("processingFee").get(function () {
  return this.processingFeeInKobo / 100;
});

planSchema.virtual("administrationFee").get(function () {
  return this.administrationFeeInKobo / 100;
});

planSchema.virtual("insuranceFee").get(function () {
  return this.insuranceFeeInKobo / 100;
});

planSchema.virtual("minimumDownPayment").get(function () {
  return this.minimumDownPaymentInKobo / 100;
});

planSchema.virtual("durationYears").get(function () {
  return (this.durationMonths / 12).toFixed(1);
});

planSchema.virtual("totalFeesInKobo").get(function () {
  return (
    this.processingFeeInKobo +
    this.administrationFeeInKobo +
    this.insuranceFeeInKobo
  );
});

planSchema.virtual("totalFees").get(function () {
  return this.totalFeesInKobo / 100;
});

// PRE-SAVE HOOKS
planSchema.pre("save", function (next) {
  // Validate amount range
  if (this.maxAmountInKobo < this.minAmountInKobo) {
    return next(
      new Error(
        "Maximum amount must be greater than or equal to minimum amount"
      )
    );
  }

  // Calculate number of installments if not provided
  if (!this.numberOfInstallments) {
    const frequencyToMonths = {
      DAILY: 0.033, // ~1/30
      WEEKLY: 0.25, // ~1/4
      BIWEEKLY: 0.5, // ~1/2
      MONTHLY: 1,
      QUARTERLY: 3,
      ANNUALLY: 12,
    };

    const monthsPerInstallment =
      frequencyToMonths[this.installmentFrequency] || 1;
    this.numberOfInstallments = Math.ceil(
      this.durationMonths / monthsPerInstallment
    );
  }

  // Generate plan code if not present
  if (!this.planCode) {
    const prefix = this.planType.substring(0, 3).toUpperCase();
    const random = Math.floor(Math.random() * 10000);
    this.planCode = `${prefix}_${random}`;
  }

  // Generate slug if not present
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s]/gi, "")
      .replace(/\s+/g, "-")
      .substring(0, 100);
  }

  next();
});

// VALIDATION: Ensure activeSubscriptions <= totalSubscriptions
planSchema.pre("save", function (next) {
  if (this.activeSubscriptions > this.totalSubscriptions) {
    return next(
      new Error("Active subscriptions cannot exceed total subscriptions")
    );
  }
  next();
});

// METHODS
planSchema.methods.isAmountValid = function (amountInKobo) {
  return (
    amountInKobo >= this.minAmountInKobo && amountInKobo <= this.maxAmountInKobo
  );
};

planSchema.methods.isEligibleForRole = function (role) {
  return (
    this.eligibleRoles.includes("ALL") ||
    this.eligibleRoles.includes(role.toUpperCase())
  );
};

planSchema.methods.calculateDownPayment = function (amountInKobo) {
  const percentageAmount = (amountInKobo * this.downPaymentPercentage) / 100;
  return Math.max(percentageAmount, this.minimumDownPaymentInKobo);
};

planSchema.methods.calculateTotalFees = function (amountInKobo) {
  const processingFee =
    this.processingFeeInKobo +
    (amountInKobo * this.processingFeePercentage) / 100;
  return processingFee + this.administrationFeeInKobo + this.insuranceFeeInKobo;
};

planSchema.methods.calculateAmortizationSchedule = function (amountInKobo) {
  if (!this.isAmountValid(amountInKobo)) {
    throw new Error("Amount is outside plan range");
  }

  // Calculate down payment
  const downPayment = this.calculateDownPayment(amountInKobo);
  const financedAmount = amountInKobo - downPayment;
  const totalFees = this.calculateTotalFees(amountInKobo);

  // Calculate interest based on type
  let totalInterest = 0;

  switch (this.interestType) {
    case "SIMPLE":
      // Simple interest: I = P * r * t
      totalInterest =
        (financedAmount *
          this.interestRatePerAnnum *
          (this.durationMonths / 12)) /
        100;
      break;

    case "COMPOUND":
      // Compound interest: A = P(1 + r/n)^(nt)
      const n =
        this.interestCompoundingFrequency === "MONTHLY"
          ? 12
          : this.interestCompoundingFrequency === "QUARTERLY"
          ? 4
          : this.interestCompoundingFrequency === "ANNUALLY"
          ? 1
          : 365;

      const t = this.durationMonths / 12;
      totalInterest =
        financedAmount *
          Math.pow(1 + this.interestRatePerAnnum / 100 / n, n * t) -
        financedAmount;
      break;

    case "REDUCING_BALANCE":
      // Reducing balance (most common for mortgages)
      // We'll use the formula for EMI
      const monthlyRate = this.interestRatePerAnnum / 12 / 100;
      const emi =
        (financedAmount *
          monthlyRate *
          Math.pow(1 + monthlyRate, this.numberOfInstallments)) /
        (Math.pow(1 + monthlyRate, this.numberOfInstallments) - 1);

      totalInterest = emi * this.numberOfInstallments - financedAmount;
      break;

    case "FLAT":
      // Flat interest
      totalInterest =
        (financedAmount * this.interestRatePerAnnum * this.durationMonths) /
        1200;
      break;
  }

  // Calculate total amount
  const totalAmount = financedAmount + totalInterest + totalFees;
  const installmentAmount = Math.ceil(totalAmount / this.numberOfInstallments);

  // Generate schedule
  const schedule = [];
  let balance = totalAmount;
  const installmentDate = new Date();

  for (let i = 1; i <= this.numberOfInstallments; i++) {
    const payment =
      i === this.numberOfInstallments ? balance : installmentAmount;
    balance -= payment;

    schedule.push({
      installmentNumber: i,
      dueDate: new Date(
        installmentDate.setMonth(installmentDate.getMonth() + 1)
      ),
      amountInKobo: payment,
      amount: payment / 100,
      principal: Math.round(financedAmount / this.numberOfInstallments),
      interest: Math.round(totalInterest / this.numberOfInstallments),
      fees: Math.round(totalFees / this.numberOfInstallments),
      remainingBalance: balance,
    });
  }

  return {
    downPaymentInKobo: Math.round(downPayment),
    downPayment: downPayment / 100,
    financedAmountInKobo: Math.round(financedAmount),
    financedAmount: financedAmount / 100,
    totalInterestInKobo: Math.round(totalInterest),
    totalInterest: totalInterest / 100,
    totalFeesInKobo: Math.round(totalFees),
    totalFees: totalFees / 100,
    totalAmountInKobo: Math.round(totalAmount),
    totalAmount: totalAmount / 100,
    installmentAmountInKobo: Math.round(installmentAmount),
    installmentAmount: installmentAmount / 100,
    numberOfInstallments: this.numberOfInstallments,
    schedule: schedule,
  };
};

planSchema.methods.calculateLatePaymentPenalty = function (
  amountInKobo,
  daysLate
) {
  if (daysLate <= this.gracePeriodDays) return 0;

  const percentagePenalty =
    (amountInKobo * this.latePaymentPenaltyPercentage) / 100;
  return percentagePenalty + this.latePaymentPenaltyFixedInKobo;
};

planSchema.methods.incrementSubscriptions = async function () {
  this.totalSubscriptions += 1;
  this.activeSubscriptions += 1;
  return await this.save();
};

planSchema.methods.decrementActiveSubscriptions = async function () {
  if (this.activeSubscriptions > 0) {
    this.activeSubscriptions -= 1;
    return await this.save();
  }
  return this;
};

planSchema.methods.incrementSuccessfulCompletions = async function () {
  this.successfulCompletions += 1;
  return await this.save();
};

planSchema.methods.markAsInactive = async function () {
  if (this.activeSubscriptions > 0) {
    throw new Error("Cannot deactivate plan with active subscriptions");
  }
  this.isActive = false;
  return await this.save();
};

planSchema.methods.markAsActive = async function () {
  this.isActive = true;
  return await this.save();
};

// STATIC METHODS
planSchema.statics.findActive = function () {
  return this.find({ isActive: true, isPublic: true }).sort({
    displayOrder: 1,
    createdAt: -1,
  });
};

planSchema.statics.findByType = function (planType) {
  return this.find({ planType, isActive: true }).sort({ minAmountInKobo: 1 });
};

planSchema.statics.findForAmount = function (amountInKobo) {
  return this.find({
    isActive: true,
    minAmountInKobo: { $lte: amountInKobo },
    maxAmountInKobo: { $gte: amountInKobo },
  }).sort({ durationMonths: 1 });
};

planSchema.statics.findRecommended = function () {
  return this.find({ isRecommended: true, isActive: true, isPublic: true })
    .sort({ displayOrder: 1 })
    .limit(6);
};

planSchema.statics.findByEligibleRole = function (role) {
  return this.find({
    isActive: true,
    $or: [{ eligibleRoles: "ALL" }, { eligibleRoles: role.toUpperCase() }],
  }).sort({ displayOrder: 1 });
};

planSchema.statics.getPlanStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalPlans: { $sum: 1 },
        activePlans: { $sum: { $cond: ["$isActive", 1, 0] } },
        publicPlans: { $sum: { $cond: ["$isPublic", 1, 0] } },
        totalSubscriptions: { $sum: "$totalSubscriptions" },
        activeSubscriptions: { $sum: "$activeSubscriptions" },
        byType: {
          $push: {
            type: "$planType",
            count: 1,
            subscriptions: "$totalSubscriptions",
          },
        },
      },
    },
  ]);

  const popularPlans = await this.find()
    .sort({ totalSubscriptions: -1 })
    .limit(5)
    .select("name planType totalSubscriptions activeSubscriptions");

  return {
    ...stats[0],
    popularPlans,
  };
};

const Plan = mongoose.model("Plan", planSchema);

export default Plan;
