import express from 'express';
import { checkNumber } from '../controllers/authController.js';

const router = express.Router();

router.get('/check-number', checkNumber);

export default router;
