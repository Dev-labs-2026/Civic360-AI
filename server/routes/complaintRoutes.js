import express from 'express';
import {
  getComplaints,
  getComplaintById,
  createComplaint,
  updateComplaint,
  deleteComplaint,
  analyzeComplaintDraft,
} from '../controllers/complaintController.js';
import { protect, authorize } from '../middleware/auth.js';
import { publicAnalysisRateLimit, rateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

// Real-time rule-based complaint analysis
router.post('/analyze', publicAnalysisRateLimit, analyzeComplaintDraft);

// Complaint CRUD routes
router
  .route('/')
  .get(rateLimit({ windowMs: 60_000, max: 60 }), (req, res, next) => {
    // If bearer token present, authenticate optionally, else continue
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      return protect(req, res, next);
    }
    next();
  }, getComplaints)
  .post(protect, authorize('citizen'), createComplaint);

router
  .route('/:id')
  .get(rateLimit({ windowMs: 60_000, max: 60 }), (req, res, next) => {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      return protect(req, res, next);
    }
    next();
  }, getComplaintById)
  .put(protect, updateComplaint)
  .delete(protect, deleteComplaint);

export default router;
