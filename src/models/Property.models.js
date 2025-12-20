import mongoose from "mongoose";

const propertySchema = new mongoose.Schema(
  {
    // Informations de base
    title: {
      type: String,
      required: [true, "Property title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
      index: true,
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },

    // Prix en kobo (pour éviter float precision errors)
    priceInKobo: {
      type: Number,
      required: [true, "Price is required"],
      min: [10000, "Minimum price is 100 NGN"], // 100 NGN minimum
      validate: {
        validator: Number.isInteger,
        message: "Price must be an integer (kobo)",
      },
      index: true,
    },

    // Location
    location: {
      country: {
        type: String,
        default: "Nigeria",
      },
      state: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },
      city: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },
      address: {
        type: String,
        required: true,
        trim: true,
      },
      landmark: String,
      zipCode: String,
      // Pour future map integration
      coordinates: {
        lat: { type: Number },
        lng: { type: Number },
      },
    },

    // Détails de la propriété
    details: {
      propertyType: {
        type: String,
        enum: [
          "APARTMENT",
          "HOUSE",
          "LAND",
          "COMMERCIAL",
          "VILLA",
          "DUPLEX",
          "BUNGALOW",
          "TERRACE",
          "SEMI_DETACHED",
          "MANSION",
        ],
        required: true,
        index: true,
      },
      bedrooms: {
        type: Number,
        min: 0,
        default: 0,
      },
      bathrooms: {
        type: Number,
        min: 0,
        default: 0,
      },
      toilets: {
        type: Number,
        min: 0,
        default: 0,
      },
      // En mètres carrés
      landArea: {
        type: Number,
        min: 0,
        description: "Land area in square meters",
      },
      buildingArea: {
        type: Number,
        min: 0,
        description: "Building area in square meters",
      },
      yearBuilt: {
        type: Number,
        min: 1800,
        max: new Date().getFullYear(),
      },
      condition: {
        type: String,
        enum: ["NEW", "EXCELLENT", "GOOD", "NEEDS_RENOVATION", "OLD"],
        default: "GOOD",
      },
      features: [
        {
          type: String,
          enum: [
            "SWIMMING_POOL",
            "GARDEN",
            "PARKING",
            "SECURITY",
            "FURNISHED",
            "AIR_CONDITIONING",
            "GENERATOR",
            "WIFI",
            "GYM",
            "ELEVATOR",
            "CCTV",
            "WATER_SUPPLY",
            "24_7_SECURITY",
            "PET_FRIENDLY",
            "BALCONY",
            "FIREPLACE",
            "SMART_HOME",
          ],
        },
      ],
    },

    // Images (URLs stockées - upload géré séparément)
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        caption: String,
        isPrimary: {
          type: Boolean,
          default: false,
        },
        order: {
          type: Number,
          default: 0,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Cover image
    coverImage: {
      url: { type: String },
      caption: { type: String },
    },

    // Documents
    documents: [
      {
        name: String,
        url: String,
        type: {
          type: String,
          enum: [
            "DEED",
            "CERTIFICATE",
            "CONTRACT",
            "SURVEY",
            "PERMIT",
            "OTHER",
          ],
        },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],

    // Payment plans disponibles pour cette propriété
    availablePaymentPlans: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Plan",
      },
    ],

    // Statut de la propriété
    status: {
      type: String,
      enum: [
        "AVAILABLE",
        "RESERVED",
        "SOLD",
        "SUSPENDED",
        "DRAFT",
        "UNAVAILABLE",
      ],
      default: "DRAFT",
      index: true,
    },

    // Si réservée ou vendue
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reservedAt: Date,
    soldAt: Date,
    salePriceInKobo: Number,

    // Propriétaire de la propriété (company ou admin)
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Realtor assigné (optionnel)
    assignedRealtorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    // Commission settings
    commissionPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 5,
    },

    // Admin controls
    isApproved: {
      type: Boolean,
      default: false,
      index: true,
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
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: Date,

    // SEO
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    metaTitle: String,
    metaDescription: String,
    keywords: [String],

    // Tags for categorization
    tags: [String],

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
propertySchema.index({ status: 1, isApproved: 1, isPublished: 1 });
propertySchema.index({ ownerId: 1 });
propertySchema.index({ "details.propertyType": 1 });
propertySchema.index({ "details.bedrooms": 1 });
propertySchema.index({ "details.bathrooms": 1 });
propertySchema.index({ "details.features": 1 });
propertySchema.index({ tags: 1 });
propertySchema.index({ isFeatured: 1, createdAt: -1 });

// VIRTUAL: Prix en Naira
propertySchema.virtual("price").get(function () {
  return this.priceInKobo / 100;
});

propertySchema.virtual("salePrice").get(function () {
  return this.salePriceInKobo ? this.salePriceInKobo / 100 : null;
});

propertySchema.virtual("primaryImage").get(function () {
  const primary = this.images.find((img) => img.isPrimary);
  return primary || this.images[0] || this.coverImage;
});

// Pre-save middleware
propertySchema.pre("save", function (next) {
  this.updatedAt = new Date();

  // Generate slug from title if not present
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s]/gi, "")
      .replace(/\s+/g, "-")
      .substring(0, 100);
  }

  // Set cover image from first image if not set
  if (!this.coverImage?.url && this.images?.length > 0) {
    this.coverImage = {
      url: this.images[0].url,
      caption: this.images[0].caption || `${this.title} - Cover Image`,
    };
  }

  next();
});

// Méthode: Réserver la propriété
propertySchema.methods.reserve = async function (buyerId) {
  this.status = "RESERVED";
  this.buyer = buyerId;
  this.reservedAt = new Date();
  return await this.save();
};

// Méthode: Marquer comme vendu
propertySchema.methods.markAsSold = async function (salePriceInKobo = null) {
  this.status = "SOLD";
  this.soldAt = new Date();
  if (salePriceInKobo) {
    this.salePriceInKobo = salePriceInKobo;
  }
  return await this.save();
};

// Méthode: Libérer la réservation
propertySchema.methods.releaseReservation = async function () {
  if (this.status === "RESERVED") {
    this.status = "AVAILABLE";
    this.buyer = undefined;
    this.reservedAt = undefined;
  }
  return await this.save();
};

// Méthode: Approuver la propriété
propertySchema.methods.approve = async function (adminId) {
  this.isApproved = true;
  this.approvedBy = adminId;
  this.approvedAt = new Date();

  if (this.status === "DRAFT") {
    this.status = "AVAILABLE";
  }

  return await this.save();
};

// Méthode: Suspendre la propriété
propertySchema.methods.suspend = async function () {
  this.status = "SUSPENDED";
  return await this.save();
};

// Méthode: Activer la propriété
propertySchema.methods.activate = async function () {
  if (this.status === "SUSPENDED") {
    this.status = "AVAILABLE";
  }
  return await this.save();
};

// Méthode: Incrémenter les vues
propertySchema.methods.incrementViews = async function () {
  this.viewsCount += 1;
  return await this.save({ validateBeforeSave: false });
};

// Méthode: Mettre en vedette
propertySchema.methods.feature = async function () {
  this.isFeatured = true;
  return await this.save();
};

// Méthode: Retirer de la vedette
propertySchema.methods.unfeature = async function () {
  this.isFeatured = false;
  return await this.save();
};

// Méthode: Publier
propertySchema.methods.publish = async function () {
  this.isPublished = true;
  this.publishedAt = new Date();
  return await this.save();
};

// Méthode: Dépublier
propertySchema.methods.unpublish = async function () {
  this.isPublished = false;
  return await this.save();
};

// Méthode: Ajouter une image
propertySchema.methods.addImage = async function (imageData) {
  this.images.push(imageData);
  return await this.save();
};

// Méthode: Définir l'image principale
propertySchema.methods.setPrimaryImage = async function (imageIndex) {
  // Reset all images to non-primary
  this.images.forEach((img, index) => {
    img.isPrimary = index === imageIndex;
  });
  return await this.save();
};

// Méthode: Calculer la commission
propertySchema.methods.calculateCommission = function (salePrice = null) {
  const price = salePrice || this.priceInKobo || this.salePriceInKobo;
  if (!price) return 0;

  const commissionPercentage = this.commissionPercentage || 5;
  return Math.round(price * (commissionPercentage / 100));
};

// Méthodes statiques
propertySchema.statics.findAvailable = function () {
  return this.find({
    status: "AVAILABLE",
    isApproved: true,
    isPublished: true,
  });
};

propertySchema.statics.findFeatured = function (limit = 10) {
  return this.find({
    isFeatured: true,
    isApproved: true,
    isPublished: true,
    status: "AVAILABLE",
  }).limit(limit);
};

propertySchema.statics.findByOwner = function (ownerId) {
  return this.find({ ownerId });
};

propertySchema.statics.findByRealtor = function (realtorId) {
  return this.find({ assignedRealtorId: realtorId });
};

propertySchema.statics.findByBuyer = function (buyerId) {
  return this.find({ buyer: buyerId });
};

propertySchema.statics.findPendingApproval = function () {
  return this.find({ isApproved: false });
};

propertySchema.statics.findByFilters = function (filters = {}) {
  const query = {
    isApproved: true,
    isPublished: true,
    status: "AVAILABLE",
  };

  if (filters.state) query["location.state"] = new RegExp(filters.state, "i");
  if (filters.city) query["location.city"] = new RegExp(filters.city, "i");
  if (filters.propertyType)
    query["details.propertyType"] = filters.propertyType;
  if (filters.minPrice || filters.maxPrice) {
    query.priceInKobo = {};
    if (filters.minPrice) query.priceInKobo.$gte = parseInt(filters.minPrice);
    if (filters.maxPrice) query.priceInKobo.$lte = parseInt(filters.maxPrice);
  }
  if (filters.minBedrooms)
    query["details.bedrooms"] = { $gte: parseInt(filters.minBedrooms) };
  if (filters.maxBedrooms)
    query["details.bedrooms"] = { $lte: parseInt(filters.maxBedrooms) };
  if (filters.features) query["details.features"] = { $all: filters.features };

  return this.find(query);
};

const Property = mongoose.model("Property", propertySchema);
export default Property;
