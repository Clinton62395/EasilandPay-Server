import * as editorService from "../services/editors.service.js";
import { catchAsynch } from "../utils/catchAsynch.utils.js";

export const createEditor = catchAsynch(async (req, res) => {
  const editor = await editorService.createEditor(req.body);
  res.status(201).json({ success: true, message: "Editor content created successfully", data: editor });
});

export const getAllEditors = catchAsynch(async (req, res) => {
  const { authorId, search, page, limit } = req.query;
  const result = await editorService.getAllEditors({ authorId, search, page, limit });
  res.status(200).json({ success: true, ...result, data: result.editors });
});

export const getEditorById = catchAsynch(async (req, res) => {
  const editor = await editorService.getEditorById(req.params.id);
  res.status(200).json({ success: true, data: editor });
});

export const updateEditor = catchAsynch(async (req, res) => {
  const editor = await editorService.updateEditor(req.params.id, req.body);
  res.status(200).json({ success: true, message: "Editor content updated successfully", data: editor });
});

export const deleteEditor = catchAsynch(async (req, res) => {
  await editorService.deleteEditor(req.params.id);
  res.status(200).json({ success: true, message: "Editor content deleted successfully" });
});

export const getEditorsByAuthor = catchAsynch(async (req, res) => {
  const { page, limit } = req.query;
  const result = await editorService.getEditorsByAuthor(req.params.authorId, parseInt(page), parseInt(limit));
  res.status(200).json({ success: true, ...result, data: result.editors });
});

export const searchEditors = catchAsynch(async (req, res) => {
  const { query, page, limit } = req.query;
  const result = await editorService.searchEditors(query, parseInt(page), parseInt(limit));
  res.status(200).json({ success: true, ...result, data: result.editors });
});

export const getLatestEditors = catchAsynch(async (req, res) => {
  const { limit } = req.query;
  const editors = await editorService.getLatestEditors(parseInt(limit));
  res.status(200).json({ success: true, count: editors.length, data: editors });
});

export const getEditorStats = catchAsynch(async (req, res) => {
  const stats = await editorService.getEditorStats();
  res.status(200).json({ success: true, data: stats });
});
