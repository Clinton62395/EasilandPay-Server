// services/editor.service.js
import Editors from "../models/Editor.models.js";
import { AppError } from "../utils/appError.utils.js";
import { editorPopulate } from "../utils/helpers.utils.js";

export const createEditor = async (data) => {
  const editor = await Editors.create(data);
  await editor.populate(editorPopulate);
  return editor;
};

export const getAllEditors = async ({
  authorId,
  search,
  page = 1,
  limit = 10,
}) => {
  const filter = {};
  if (authorId) filter.AuthorId = authorId;
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: "i" } },
      { content: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;
  const editors = await Editors.find(filter)
    .populate(editorPopulate)
    .limit(limit)
    .skip(skip)
    .sort({ createdAt: -1 });

  const total = await Editors.countDocuments(filter);

  return { editors, total, page, pages: Math.ceil(total / limit) };
};

export const getEditorById = async (id) => {
  const editor = await Editors.findById(id).populate(editorPopulate);
  if (!editor) throw new AppError("Editor content not found", 404);
  return editor;
};

export const updateEditor = async (id, updates) => {
  const editor = await Editors.findByIdAndUpdate(id, updates, {
    new: true,
    runValidators: true,
  }).populate(editorPopulate);
  if (!editor) throw new AppError("Editor content not found", 404);
  return editor;
};

export const deleteEditor = async (id) => {
  const editor = await Editors.findByIdAndDelete(id);
  if (!editor) throw new AppError("Editor content not found", 404);
  return editor;
};

export const getEditorsByAuthor = async (authorId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const editors = await Editors.find({ AuthorId: authorId })
    .populate(editorPopulate)
    .limit(limit)
    .skip(skip)
    .sort({ createdAt: -1 });
  const total = await Editors.countDocuments({ AuthorId: authorId });
  return { editors, total, page, pages: Math.ceil(total / limit) };
};

export const searchEditors = async (query, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const editors = await Editors.find({
    $or: [
      { title: { $regex: query, $options: "i" } },
      { content: { $regex: query, $options: "i" } },
    ],
  })
    .populate(editorPopulate)
    .limit(limit)
    .skip(skip)
    .sort({ createdAt: -1 });

  const total = await Editors.countDocuments({
    $or: [
      { title: { $regex: query, $options: "i" } },
      { content: { $regex: query, $options: "i" } },
    ],
  });

  return { editors, total, page, pages: Math.ceil(total / limit) };
};

export const getLatestEditors = async (limit = 10) => {
  const editors = await Editors.find()
    .populate(editorPopulate)
    .limit(limit)
    .sort({ createdAt: -1 });
  return editors;
};

export const getEditorStats = async () => {
  const totalContents = await Editors.countDocuments();

  const contentsByAuthor = await Editors.aggregate([
    { $group: { _id: "$AuthorId", count: { $sum: 1 } } },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "author",
      },
    },
    { $unwind: "$author" },
    {
      $project: {
        _id: 1,
        count: 1,
        authorName: { $concat: ["$author.firstName", " ", "$author.lastName"] },
        authorEmail: "$author.email",
      },
    },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentContents = await Editors.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
  });

  const avgContentLength = await Editors.aggregate([
    { $project: { contentLength: { $strLenCP: "$content" } } },
    { $group: { _id: null, avgLength: { $avg: "$contentLength" } } },
  ]);

  return {
    totalContents,
    recentContents,
    averageContentLength: Math.round(avgContentLength[0]?.avgLength || 0),
    topAuthors: contentsByAuthor,
  };
};
