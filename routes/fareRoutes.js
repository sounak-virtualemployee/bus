import express from 'express';
import protectAdmin from '../middlewares/adminAuthMiddleware.js';
import { createFare, deleteFareById, getAllFares, getFareById, updateFareById } from '../controllers/fareController.js';

const router = express.Router();

router.post('/create', protectAdmin, createFare);

router.get('/all', protectAdmin, getAllFares); // ✅ Add this

router.get('/byid', protectAdmin, getFareById);

router.patch('/update', protectAdmin, updateFareById);

router.delete('/delete', protectAdmin, deleteFareById);



export default router;
