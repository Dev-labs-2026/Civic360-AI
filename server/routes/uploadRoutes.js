import express from 'express';
import { upload } from '../middleware/upload.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   POST /api/upload
 * @desc    Upload an issue image
 * @access  Private
 */
router.post('/', protect, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded or file format not supported',
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    return res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      imageUrl: fileUrl,
      fileName: req.file.filename,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'File upload error',
    });
  }
});

export default router;
