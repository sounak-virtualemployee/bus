import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

// import busRoutes from './routes/busRoutes.js';
// import bookingRoutes from './routes/bookingRoutes.js';
import adminRoutes from "./routes/adminRoutes.js";
import conductorRoutes from "./routes/conductorRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import fareRoutes from "./routes/fareRoutes.js";
import pdfRoutes from "./routes/pdfRoutes.js";
import pathRoutes from "./routes/pathRoutes.js";
import csvRoutes from "./routes/csvRoutes.js";


dotenv.config();
connectDB();

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// app.use('/api/buses', busRoutes);
// app.use('/api/bookings', bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/conductor", conductorRoutes);
app.use("/api/auth",authRoutes)
app.use("/api/fare",fareRoutes)
app.use("/api/path",pathRoutes)
app.use("/api/csv",csvRoutes)
app.use('/public', express.static('public'));

app.use("/api/pdf",pdfRoutes)

app.get("/", (req, res) => {
  res.json({ message: "Hello The Backend Is In Running Condition" });
});
const PORT = process.env.PORT ;
app.listen(PORT, '0.0.0.0', () => {
    console.log("Server running on port 7000");
});
