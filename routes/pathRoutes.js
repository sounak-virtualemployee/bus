import express from 'express';
import { createPath, deletePathById, getAllPaths, getPathById, updatePathById } from '../controllers/pathController.js';
import protectAdmin from '../middlewares/adminAuthMiddleware.js';

const router = express.Router();

router.post('/create', protectAdmin, createPath);

router.get('/all', protectAdmin, getAllPaths);

router.get('/byid', protectAdmin, getPathById);

router.patch('/update', protectAdmin, updatePathById);

router.delete('/delete', protectAdmin, deletePathById);

export default router;
