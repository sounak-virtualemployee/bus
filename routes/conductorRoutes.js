import express from 'express';
import { createConductor, deleteConductorById, getAllConductors, getConductorById, loginConductor, updateConductorById } from '../controllers/conductorController.js';
import protectAdmin from '../middlewares/adminAuthMiddleware.js';

const router = express.Router();

router.post('/create', protectAdmin, createConductor);
router.get('/all', protectAdmin, getAllConductors);
router.get('/details', protectAdmin, getConductorById);
router.patch('/update', protectAdmin, updateConductorById);
router.delete('/delete', protectAdmin, deleteConductorById);


router.post('/login', loginConductor);

export default router;
