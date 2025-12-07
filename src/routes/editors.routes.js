import express from "express";

import {
  createEditorValidator,
  deleteEditorValidator,
  getAllEditorsValidator,
  getEditorByIdValidator,
  getEditorsByAuthorValidator,
  searchEditorsValidator,
  updateEditorValidator,
} from "../validations/editors.validators.js";
import {
  createEditor,
  deleteEditor,
  getAllEditors,
  getEditorById,
  getEditorsByAuthor,
  getEditorStats,
  getLatestEditors,
  searchEditors,
  updateEditor,
} from "../controllers/editors.controller.js";

const router = express.Router();
/**
 * @swagger
 * /api/editors:
 *   post:
 *     tags: [Editors]
 *     summary: Create new editor content
 *     description: Create a new editor article or content. Only Admin or Staff can create.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EditorInput'
 *     responses:
 *       201:
 *         description: Editor content created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */

router.post("/", createEditorValidator, createEditor);
/**
 * @swagger
 * /api/editors:
 *   get:
 *     tags: [Editors]
 *     summary: Get all editor contents
 *     description: Retrieve all editor articles with filters (authorId, search, pagination)
 *     parameters:
 *       - in: query
 *         name: authorId
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: List of editor contents
 */

router.get("/", getAllEditorsValidator, getAllEditors);

/**
 * @swagger
 * /api/editors/stats/summary:
 *   get:
 *     tags: [Editors]
 *     summary: Get editor statistics
 *     description: Returns analytics summary for editor posts (Admin/Staff only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stats retrieved successfully
 */

router.get("/stats/summary", getEditorStats);

/**
 * @swagger
 * /api/editors/latest:
 *   get:
 *     tags: [Editors]
 *     summary: Get latest editor contents
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 10
 *     responses:
 *       200:
 *         description: Latest editor posts returned
 */

router.get("/latest", getLatestEditors);

/**
 * @swagger
 * /api/editors/search:
 *   get:
 *     tags: [Editors]
 *     summary: Search editor contents
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Search results returned
 *       400:
 *         description: Missing or invalid query parameter
 */

router.get("/search", searchEditorsValidator, searchEditors);

/**
 * @swagger
 * /api/editors/author/{authorId}:
 *   get:
 *     tags: [Editors]
 *     summary: Get editor contents by author
 *     parameters:
 *       - in: path
 *         name: authorId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Editor contents by author
 *       404:
 *         description: Author not found
 */

router.get(
  "/author/:authorId",
  getEditorsByAuthorValidator,
  getEditorsByAuthor
);

/**
 * @swagger
 * /api/editors/{id}:
 *   get:
 *     tags: [Editors]
 *     summary: Get editor content by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Single editor content
 *       404:
 *         description: Editor not found
 */

router.get("/:id", getEditorByIdValidator, getEditorById);

/**
 * @swagger
 * /api/editors/{id}:
 *   put:
 *     tags: [Editors]
 *     summary: Update editor content
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EditorInput'
 *     responses:
 *       200:
 *         description: Editor content updated
 *       404:
 *         description: Editor not found
 */

router.put("/:id", updateEditorValidator, updateEditor);

/**
 * @swagger
 * /api/editors/{id}:
 *   delete:
 *     tags: [Editors]
 *     summary: Delete editor content
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Editor deleted successfully
 *       404:
 *         description: Editor not found
 */

router.delete("/:id", deleteEditorValidator, deleteEditor);

export default router;
