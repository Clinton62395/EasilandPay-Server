import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
  {
    // Informations de base
    title: {
      type: String,
      required: [true, "Property title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },

    // Prix en kobo (pour éviter float precision errors)
    priceInKobo: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },

    // Location
    location: {
      state: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      address: String,
      // Pour future map integration
      coordinates: {
        latitude: Number,
        longitude: Number,
      },
    },

    // Détails de la propriété
    details: {
      bedrooms: {
        type: Number,
        min: 0,
      },
      bathrooms: {
        type: Number,
        min: 0,
      },
      // En mètres carrés
      sizeInSqm: {
        type: Number,
        min: 0,
      },
      propertyType: {
        type: String,
        enum: ["apartment", "house", "land", "commercial", "duplex", "villa"],
        default: "apartment",
      },
    },

    // Images (URLs stockées - upload géré séparément)
    images: [
      {
        url: String,
        caption: String,
      },
    ],

    // Cover image (première image par défaut)
    coverImage: {
      type: String,
      caption: String,
    },

    // Payment plans disponibles pour cette propriété
    availablePaymentPlans: [
      {
        type: String,
        enum: [
          "weekly",
          "monthly",
          "quarterly",
          "bi-annual",
          "yearly",
          "outright",
        ],
      },
    ],

    // Statut de la propriété
    status: {
      type: String,
      enum: ["available", "reserved", "sold", "suspended"],
      default: "available",
    },

    // Si réservée, par qui ?
    reservedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    reservedAt: Date,

    // Propriétaire de la propriété (company ou admin)
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Realtor assigné (optionnel)
    assignedRealtorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Admin controls
    isApproved: {
      type: Boolean,
      default: false, // Admin doit approuver avant affichage public
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    approvedAt: Date,

    // Metadata
    viewsCount: {
      type: Number,
      default: 0,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// INDEX pour recherches rapides
propertySchema.index({ "location.state": 1, "location.city": 1 });
propertySchema.index({ priceInKobo: 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ isApproved: 1 });
propertySchema.index({ ownerId: 1 });

// VIRTUAL: Prix en Naira (pour faciliter l'affichage)
propertySchema.virtual("price").get(function () {
  return this.priceInKobo / 100;
});

// PRE-SAVE: Update timestamp
propertySchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// METHOD: Réserver la propriété
propertySchema.methods.reserve = function (buyerId) {
  this.status = "reserved";
  this.reservedBy = buyerId;
  this.reservedAt = new Date();
  return this.save();
};

// METHOD: Marquer comme vendu
propertySchema.methods.markAsSold = function () {
  this.status = "sold";
  return this.save();
};

const Property = mongoose.model("Property", propertySchema);

export default Property;
