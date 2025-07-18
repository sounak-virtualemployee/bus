import express from 'express';
import { calculateFare, createPath, deletePathById, getAllPaths, getPathById,  getPointsListByRouteName, updatePathById } from '../controllers/pathController.js';
import protectAdmin from '../middlewares/adminAuthMiddleware.js';
import protectConductor from '../middlewares/conductorAuthMiddleware.js';

const router = express.Router();

router.post('/create', protectAdmin, createPath);

router.get('/all', protectAdmin, getAllPaths);

router.get('/byid', protectAdmin, getPathById);

router.patch('/update', protectAdmin, updatePathById);

router.delete('/delete', protectAdmin, deletePathById);

/// conductor
router.get('/points-by-route', protectConductor , getPointsListByRouteName);

router.post('/calculate-fare', protectConductor, calculateFare);

export default router;
