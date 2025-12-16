import mongoose, { Schema } from "mongoose";

const editorSchema = new mongoose.Schema(
  {
    // Author of the content
    AuthorId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author ID is required"],
      index: true,
    },

    // Title of the content
    title: {
      type: String,
      required: [true, "Title is required"], // FIXED: "require" → "required"
      trim: true,
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [200, "Title cannot exceed 200 characters"],
    },

    // Main content
    content: {
      type: String,
      required: [true, "Content is required"], // FIXED: "require" → "required"
      minlength: [50, "Content must be at least 50 characters"],
      maxlength: [50000, "Content cannot exceed 50,000 characters"],
    },

    // Payment methods accepted for this content (if applicable)
    paymentMethod: {
      type: [String],
      enum: {
        values: ["card", "bank_transfer", "paystack", "wallet", "cash"],
        message: "{VALUE} is not a valid payment method",
      },
      default: [],
    },

    // Additional metadata
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },

    // View count (for analytics)
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Featured content
    isFeatured: {
      type: Boolean,
      default: false,
    },

    // Tags for categorization
    tags: {
      type: [String],
      default: [],
    },

    // SEO fields
    metaDescription: {
      type: String,
      maxlength: 160,
    },

    slug: {
      type: String,
      unique: true,
      sparse: true, // Allow null values but unique when present
      lowercase: true,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// INDEXES for performance
editorSchema.index({ AuthorId: 1, status: 1 });
editorSchema.index({ createdAt: -1 });
editorSchema.index({ title: "text", content: "text" }); // Text search

// VIRTUAL: Read time estimation (based on average 200 words per minute)
editorSchema.virtual("readTimeMinutes").get(function () {
  const wordCount = this.content.split(/\s+/).length;
  return Math.ceil(wordCount / 200);
});

// VIRTUAL: Content preview (first 150 characters)
editorSchema.virtual("preview").get(function () {
  return (
    this.content.substring(0, 150) + (this.content.length > 150 ? "..." : "")
  );
});

// PRE-SAVE HOOK: Generate slug from title
editorSchema.pre("save", function (next) {
  if (this.isModified("title") && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
      .trim();
  }
  next();
});

// PRE-SAVE HOOK: Update updatedAt
editorSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// METHOD: Increment view count
editorSchema.methods.incrementViews = function () {
  this.viewCount += 1;
  return this.save();
};

// METHOD: Publish content
editorSchema.methods.publish = function () {
  this.status = "published";
  return this.save();
};

// METHOD: Archive content
editorSchema.methods.archive = function () {
  this.status = "archived";
  return this.save();
};

// STATIC: Find published contents
editorSchema.statics.findPublished = function () {
  return this.find({ status: "published" }).sort({ createdAt: -1 });
};

// STATIC: Find featured contents
editorSchema.statics.findFeatured = function (limit = 5) {
  return this.find({ status: "published", isFeatured: true })
    .limit(limit)
    .sort({ createdAt: -1 });
};

const Editors = mongoose.model("Editors", editorSchema);

export default Editors;
