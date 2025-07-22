import express from 'express';
import { createAdmin, getDashboardStats, loginAdmin } from '../controllers/adminController.js';
import protectAdmin from '../middlewares/adminAuthMiddleware.js';
import { getConductorMonthlySummary } from '../controllers/pdfController.js';

const router = express.Router();

router.post('/create', createAdmin);
router.post('/login', loginAdmin);
router.get('/dashboard-stats', protectAdmin, getDashboardStats);
router.get('/conductor-ticket', protectAdmin, getConductorMonthlySummary);


export default router;
