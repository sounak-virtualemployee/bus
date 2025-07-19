import express from 'express';
import {  generateTicket } from '../controllers/pdfController.js';

const router = express.Router();

router.post('/generate-ticket', generateTicket);

export default router;
