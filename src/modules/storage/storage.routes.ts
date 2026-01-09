import { Router } from 'express';
import multer from 'multer';
import { uploadFile, deleteFile } from './storage.controller';
import { protect, restrictTo } from '../../middlewares/auth.middleware';

const router = Router();

// Multer Settings (Keep file in RAM temporarily)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // Max 5MB file size
});

/**
 * @swagger
 * /storage/upload:
 *   post:
 *     summary: Upload a file (Admin and Dealer Admin only)
 *     tags: [Storage]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: File uploaded successfully.
 */
router.post('/upload',
    protect,
    restrictTo('producer_admin', 'dealer_admin'), // Only admins can upload
    upload.single('file'), // Take file from 'file' field
    uploadFile
);

/**
 * @swagger
 * /storage/delete:
 *   delete:
 *     summary: Delete a file
 *     tags: [Storage]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: File deleted successfully.
 */
router.delete('/delete',
    protect,
    restrictTo('producer_admin', 'dealer_admin'),
    deleteFile
);

/**
 * Express router for handling storage/file operations.
 */
export default router;