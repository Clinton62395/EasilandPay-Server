import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    // Informations de base
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
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Ne pas retourner le password dans les queries par défaut
    },

    // Type d'utilisateur (5 rôles selon PRD)
    role: {
      type: String,
      enum: {
        values: ["buyer", "realtor", "company", "staff", "admin"],
        message: "{VALUE} is not a valid role",
      },
      required: true,
    },

    // Informations personnelles
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

    // Informations spécifiques pour Companies
    companyInfo: {
      name: String,
      registrationNumber: String,
      address: String,
      // Pour salary deduction feature (Phase 2)
      employeeCount: Number,
    },

    // Informations spécifiques pour Realtors
    realtorInfo: {
      licenseNumber: String,
      // Subaccount code Paystack pour commissions automatiques
      paystackSubaccountCode: String,
      // Bank details pour withdrawals
      bankDetails: {
        accountNumber: String,
        bankCode: String,
        bankName: String,
        accountName: String,
      },
      // Total commission earned (en kobo)
      totalCommissionEarned: { type: Number, default: 0 },
      totalCommissionPaid: { type: Number, default: 0 },
    },

    // Statut du compte
    isActive: {
      type: Boolean,
      default: true,
    },

    isVerified: {
      type: Boolean,
      default: false, // Pour future KYC implementation
    },

    // Metadata
    lastLogin: Date,

    resetPasswordToken: {
      type: String,
      select: false, // ne jamais exposer le token
    },
    resetPasswordExpires: {
      type: Date,
      select: false, // expiration du token
    },
  },

  {
    timestamps: true,
    // Options pour inclure virtuals dans toJSON/toObject
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// INDEX pour performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// VIRTUAL: Full name
userSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// PRE-SAVE HOOK: Hash password avant de sauvegarder
userSchema.pre("save", async function (next) {
  // Seulement hasher si le password a été modifié
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// PRE-SAVE HOOK: Update updatedAt
userSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// METHOD: Comparer password pour login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// METHOD: Ne pas retourner password et données sensibles dans JSON
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

const User = mongoose.model("User", userSchema);

export default User;
