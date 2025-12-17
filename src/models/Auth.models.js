import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    // Basic information
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },

    password: {
      type: String,
      required: function () {
        return this.provider === "local";
      },
      select: false,
    },
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    // User role
    role: {
      type: String,
      enum: {
        values: ["buyer", "realtor", "company", "admin"],
        message: "{VALUE} is not a valid role",
      },
      required: true,
    },

    // Personal information
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },

    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },

    phoneNumber: {
      type: String,
      trim: true,
      match: [/^[0-9]{10,15}$/, "Please provide a valid phone number"],
    },

    // Company info (for company role)
    companyInfo: {
      name: String,
      registrationNumber: String,
      address: String,
      employeeCount: Number,
    },

    // Realtor info
    realtorInfo: {
      licenseNumber: String,
      paystackSubaccountCode: String,
      bio: String,
      profileImage: String,
      rating: { type: Number, default: 0 },
    },

    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    // ============================================
    // JWT & AUTH FIELDS (NEW)
    // ============================================

    refreshToken: {
      type: String,
      select: false, // Don't return in queries
    },

    verificationCode: {
      type: String,
      select: false,
    },
    verificationCodeExpires: {
      type: Date,
      select: false,
    },

    resetPasswordExpires: {
      type: Date,
      select: false,
    },

    resetPasswordToken: {
      type: String,
      select: false,
    },

    emailVerificationToken: {
      type: String,
      select: false,
    },

    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    termsCondition: { type: Boolean, default: false },

    // Metadata
    lastLogin: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// INDEXES
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// VIRTUAL: Full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// PRE-SAVE HOOK: Hash password
userSchema.pre("save", async function () {
  if (!this.password) return;
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// METHOD: Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// METHOD: Hide sensitive data in JSON
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.refreshToken;
  delete user.passwordResetToken;
  delete user.passwordResetExpires;
  delete user.emailVerificationToken;
  delete user.emailVerificationExpires;
  delete user.__v;
  return user;
};

const User = mongoose.model("User", userSchema);

export default User;
