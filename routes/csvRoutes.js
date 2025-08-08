// routes/fareRoutes.js
import express from "express";
import {
  createTicketsExcelLink,
  generateFareTemplates,
  getFareAmount,
  uploadFareExcel,
} from "../controllers/csvPathController.js";
import protectAdmin from "../middlewares/adminAuthMiddleware.js";
import multer from "multer";
import protectConductor from "../middlewares/conductorAuthMiddleware.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });
router.get("/fare/templates/:pathId", protectAdmin, generateFareTemplates);
router.post("/upload", protectAdmin, upload.array("fares", 2), uploadFareExcel);
router.post("/calculate", protectConductor, getFareAmount);

router.post("/export/link", protectAdmin, createTicketsExcelLink);

export default router;
