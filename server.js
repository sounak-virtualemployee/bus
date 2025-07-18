import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

// import busRoutes from './routes/busRoutes.js';
// import bookingRoutes from './routes/bookingRoutes.js';
import adminRoutes from "./routes/adminRoutes.js";
import conductorRoutes from "./routes/conductorRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import pathRoutes from "./routes/pathRoutes.js";
import pdfRoutes from "./routes/pdfRoutes.js";


dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// app.use('/api/buses', busRoutes);
// app.use('/api/bookings', bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/conductor", conductorRoutes);
app.use("/api/auth",authRoutes)
app.use("/api/path",pathRoutes)
app.use('/uploads', express.static('uploads'));

app.use("/api/pdf",pdfRoutes)

const PORT = process.env.PORT || 5000;
app.listen(5000, '0.0.0.0', () => {
    console.log("Server running on port 5000");
});
