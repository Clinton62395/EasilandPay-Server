import Editors from "../models/Editor.models.js";
import { AppError } from "../utils/appError.utils.js";
import { catchAsynch } from "../utils/catchAsynch.utils.js";

// ============================================
// CREATE EDITOR CONTENT
// ============================================
/**
 * @desc    Create new editor content
 * @route   POST /api/editors
 * @access  Private (Staff/Admin)
 */
export const createEditor = catchAsynch(async (req, res, next) => {
  // All validations are handled by express-validator middleware
  const newEditor = await Editors.create(req.body);

  // Populate author information
  await newEditor.populate("AuthorId", "firstName lastName email");

  res.status(201).json({
    success: true,
    message: "Editor content created successfully",
    data: newEditor,
  });
});

// ============================================
// GET ALL EDITOR CONTENTS
// ============================================
/**
 * @desc    Get all editor contents with optional filters
 * @route   GET /api/editors
 * @query   authorId, search, page, limit
 * @access  Public
 */
export const getAllEditors = catchAsynch(async (req, res, next) => {
  // All query validations are handled by express-validator middleware
  const { authorId, search, page = 1, limit = 10 } = req.query;

  // Build filter dynamically
  const filter = {};

  if (authorId) {
    filter.AuthorId = authorId;
  }

  // Search in title and content
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { content: { $regex: search, $options: "i" } },
    ];
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get editor contents with filter and pagination
  const editors = await Editors.find(filter)
    .populate("AuthorId", "firstName lastName email")
    .limit(parseInt(limit))
    .skip(skip)
    .sort({ createdAt: -1 });

  // Get total count for pagination
  const total = await Editors.countDocuments(filter);

  res.status(200).json({
    success: true,
    count: editors.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: editors,
  });
});

// ============================================
// GET EDITOR CONTENT BY ID
// ============================================
/**
 * @desc    Get a single editor content by ID
 * @route   GET /api/editors/:id
 * @access  Public
 */
export const getEditorById = catchAsynch(async (req, res, next) => {
  // ID validation is handled by express-validator middleware
  const { id } = req.params;

  const editor = await Editors.findById(id).populate(
    "AuthorId",
    "firstName lastName email"
  );

  if (!editor) {
    return next(new AppError("Editor content not found", 404));
  }

  res.status(200).json({
    success: true,
    data: editor,
  });
});

// ============================================
// UPDATE EDITOR CONTENT
// ============================================
/**
 * @desc    Update editor content
 * @route   PUT /api/editors/:id
 * @access  Private (Author/Staff/Admin)
 */
export const updateEditor = catchAsynch(async (req, res, next) => {
  // All validations are handled by express-validator middleware
  const { id } = req.params;
  const updates = req.body;

  const editor = await Editors.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).populate("AuthorId", "firstName lastName email");

  if (!editor) {
    return next(new AppError("Editor content not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Editor content updated successfully",
    data: editor,
  });
});

// ============================================
// DELETE EDITOR CONTENT
// ============================================
/**
 * @desc    Delete editor content
 * @route   DELETE /api/editors/:id
 * @access  Private (Author/Admin)
 */
export const deleteEditor = catchAsynch(async (req, res, next) => {
  // ID validation is handled by express-validator middleware
  const { id } = req.params;

  const editor = await Editors.findByIdAndDelete(id);

  if (!editor) {
    return next(new AppError("Editor content not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Editor content deleted successfully",
  });
});

// ============================================
// GET EDITOR CONTENTS BY AUTHOR
// ============================================
/**
 * @desc    Get all editor contents by a specific author
 * @route   GET /api/editors/author/:authorId
 * @access  Public
 */
export const getEditorsByAuthor = catchAsynch(async (req, res, next) => {
  // AuthorId validation is handled by express-validator middleware
  const { authorId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get editor contents by author
  const editors = await Editors.find({ AuthorId: authorId })
    .populate("AuthorId", "firstName lastName email")
    .limit(parseInt(limit))
    .skip(skip)
    .sort({ createdAt: -1 });

  const total = await Editors.countDocuments({ AuthorId: authorId });

  res.status(200).json({
    success: true,
    count: editors.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: editors,
  });
});

// ============================================
// SEARCH EDITOR CONTENTS
// ============================================
/**
 * @desc    Search editor contents by title and content
 * @route   GET /api/editors/search?query=searchTerm
 * @access  Public
 */
export const searchEditors = catchAsynch(async (req, res, next) => {
  // Query validation is handled by express-validator middleware
  const { query, page = 1, limit = 10 } = req.query;

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Search in title and content
  const editors = await Editors.find({
    $or: [
      { title: { $regex: query, $options: "i" } },
      { content: { $regex: query, $options: "i" } },
    ],
  })
    .populate("AuthorId", "firstName lastName email")
    .limit(parseInt(limit))
    .skip(skip)
    .sort({ createdAt: -1 });

  const total = await Editors.countDocuments({
    $or: [
      { title: { $regex: query, $options: "i" } },
      { content: { $regex: query, $options: "i" } },
    ],
  });

  res.status(200).json({
    success: true,
    count: editors.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    data: editors,
  });
});

// ============================================
// GET LATEST EDITOR CONTENTS
// ============================================
/**
 * @desc    Get latest editor contents
 * @route   GET /api/editors/latest
 * @access  Public
 */
export const getLatestEditors = catchAsynch(async (req, res, next) => {
  const { limit = 10 } = req.query;

  const editors = await Editors.find()
    .populate("AuthorId", "firstName lastName email")
    .limit(parseInt(limit))
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: editors.length,
    data: editors,
  });
});

// ============================================
// GET EDITOR STATISTICS
// ============================================
/**
 * @desc    Get editor content statistics
 * @route   GET /api/editors/stats/summary
 * @access  Private (Admin/Staff)
 */
export const getEditorStats = catchAsynch(async (req, res, next) => {
  // Total contents
  const totalContents = await Editors.countDocuments();

  // Contents by author
  const contentsByAuthor = await Editors.aggregate([
    {
      $group: {
        _id: "$AuthorId",
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "author",
      },
    },
    {
      $unwind: "$author",
    },
    {
      $project: {
        _id: 1,
        count: 1,
        authorName: {
          $concat: ["$author.firstName", " ", "$author.lastName"],
        },
        authorEmail: "$author.email",
      },
    },
    {
      $sort: { count: -1 },
    },
    {
      $limit: 10,
    },
  ]);

  // Recent contents count (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentContents = await Editors.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
  });

  // Average content length
  const avgContentLength = await Editors.aggregate([
    {
      $project: {
        contentLength: { $strLenCP: "$content" },
      },
    },
    {
      $group: {
        _id: null,
        avgLength: { $avg: "$contentLength" },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalContents,
      recentContents,
      averageContentLength: Math.round(avgContentLength[0]?.avgLength || 0),
      topAuthors: contentsByAuthor,
    },
  });
});
