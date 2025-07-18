import express from 'express';
import {  generateTicketWithBarcode } from '../controllers/pdfController.js';

const router = express.Router();

router.post('/generate-ticket', generateTicketWithBarcode);

export default router;
