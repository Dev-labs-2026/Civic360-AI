import express from 'express';
import { getOfficerDashboard } from '../controllers/officerController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', protect, authorize('officer', 'admin'), getOfficerDashboard);

export default router;
