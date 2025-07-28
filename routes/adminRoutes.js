import express from 'express';
import { createAdmin, getDashboardStats, loginAdmin } from '../controllers/adminController.js';
import protectAdmin from '../middlewares/adminAuthMiddleware.js';
import { getConductorMonthlySummary, getConductorTripSummaryByDate } from '../controllers/pdfController.js';

const router = express.Router();

router.post('/create', createAdmin);
router.post('/login', loginAdmin);
router.get('/dashboard-stats', protectAdmin, getDashboardStats);
router.get('/conductor-ticket', protectAdmin, getConductorMonthlySummary);

router.get('/conductor/trip-summary',protectAdmin, getConductorTripSummaryByDate);

export default router;
