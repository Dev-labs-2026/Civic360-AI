import express from 'express';
import {
  getComplaints,
  getComplaintById,
  createComplaint,
  updateComplaint,
  deleteComplaint,
  analyzeComplaintDraft,
} from '../controllers/complaintController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Real-time AI Assistant draft analysis
router.post('/analyze', analyzeComplaintDraft);

// Complaint CRUD routes
router
  .route('/')
  .get((req, res, next) => {
    // If bearer token present, authenticate optionally, else continue
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      return protect(req, res, next);
    }
    next();
  }, getComplaints)
  .post(protect, createComplaint);

router
  .route('/:id')
  .get((req, res, next) => {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      return protect(req, res, next);
    }
    next();
  }, getComplaintById)
  .put(protect, updateComplaint)
  .delete(protect, deleteComplaint);

export default router;
