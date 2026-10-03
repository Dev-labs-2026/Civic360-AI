import express from 'express';
import { upload } from '../middleware/upload.js';
import { protect } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

/**
 * @route   POST /api/upload
 * @desc    Upload an issue image
 * @access  Private
 */
router.post('/', protect, rateLimit({ windowMs: 60_000, max: 12 }), (req, res, next) => {
  upload.single('image')(req, res, (error) => {
    if (!error) return next();
    const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    return res.status(status).json({ success: false, message: status === 413 ? 'Image must be 5 MB or smaller.' : 'Invalid image upload.' });
  });
}, (req, res) => {
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
