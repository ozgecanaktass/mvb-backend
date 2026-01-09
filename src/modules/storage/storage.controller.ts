import { Request, Response } from 'express';
import { storageService } from '../../shared/utils/storage.service';
import { AppError } from '../../shared/utils/AppError';

/**
 * Uploads a single file and returns its public URL.
 * POST /api/v1/upload
 * 
 * @param req - Express request object containing the file.
 * @param res - Express response object.
 */
export const uploadFile = async (req: Request, res: Response) => {
    // Multer middleware places the file into req.file
    if (!req.file) {
        throw new AppError("Please upload a file.", 400);
    }

    try {
        // Upload file to R2
        // Uploading under 'dealers' folder (can be made dynamic)
        const fileUrl = await storageService.uploadFile(req.file, "dealers");

        res.status(201).json({
            success: true,
            message: "File uploaded successfully.",
            data: {
                url: fileUrl, // Frontend will use this URL
                fileName: req.file.originalname,
                size: req.file.size
            }
        });
    } catch (error) {
        console.error("Upload Controller Error:", error);
        throw new AppError("An error occurred while uploading the file.", 500);
    }
};

/**
 * Deletes a file given its URL.
 * DELETE /api/v1/upload
 * 
 * @param req - Express request object containing fileUrl in body.
 * @param res - Express response object.
 */
export const deleteFile = async (req: Request, res: Response) => {
    const { fileUrl } = req.body;

    if (!fileUrl) {
        throw new AppError("File URL to delete must be specified.", 400);
    }

    try {
        await storageService.deleteFile(fileUrl);

        res.status(200).json({
            success: true,
            message: "File deleted successfully."
        });
    } catch (error) {
        throw new AppError("Failed to delete the file.", 500);
    }
};