import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getModel } from "../config/dbConnection.js";

const Admin = getModel("Pratima","Admin");
const Conductor = getModel("Pratima","Conductor");

export const createAdmin = async (req, res) => {
  try {
    const { number, name, company_name, logo, password } = req.body;

    // Check if admin number already exists
    const existingAdmin = await Admin.findOne({ number });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin number already exists" });
    }

    // Validate required fields
    if (!number || !name || !company_name || !password) {
      return res.status(400).json({ message: "Required fields are missing" });
    }

    // Create new admin
    const admin = new Admin({
      number,
      name,
      company_name,
      logo: logo || "", // optional, default empty string if not provided
      password,
    });

    await admin.save();

    res.status(201).json({
      message: "Admin created successfully",
      admin: {
        id: admin._id,
        number: admin.number,
        name: admin.name,
        company_name: admin.company_name,
        logo: admin.logo,
        roles: admin.roles,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const loginAdmin = async (req, res) => {
  const {number}=req.query;
  
  try {
    const {  password } = req.body;

    // Check if admin exists
    const admin = await Admin.findOne({ number });
    if (!admin) {
      return res.status(400).json({ message: "Invalid number or password" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid number or password" });
    }

    // Generate JWT Token
    const token = jwt.sign(
      {
        id: admin._id,
        number: admin.number,
        company_name: admin.company_name,
        logo: admin.logo,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      admin: {
        id: admin._id,
        number: admin.number,
        name: admin.name,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};



export const getDashboardStats = async (req, res) => {
    
  try {
    const company_name = req.admin.company_name; // from token (middleware)
      const Ticket = getModel(company_name, "Ticket");

      console.log(company_name);

    // 1. Total Conductors
    const totalConductors = await Conductor.countDocuments({ company_name });

    // Today's Date Range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 2. Active Conductors Today (distinct conductor_id)
    const activeConductorIdsToday = await Ticket.distinct("conductor_id", {
      company_name,
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });
    const activeConductorsToday = activeConductorIdsToday.length;

    // 3. Total Income Today
    const ticketsToday = await Ticket.aggregate([
      {
        $match: {
          company_name,
          createdAt: { $gte: todayStart, $lte: todayEnd },
        },
      },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: "$total" },
        },
      },
    ]);
    const totalIncomeToday = ticketsToday[0]?.totalIncome || 0;

    // 4. Monthly Income (for current month)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const monthlyTickets = await Ticket.aggregate([
      {
        $match: {
          company_name,
          createdAt: { $gte: monthStart, $lt: nextMonthStart },
        },
      },
      {
        $group: {
          _id: null,
          monthlyIncome: { $sum: "$total" },
        },
      },
    ]);
    const monthlyIncome = monthlyTickets[0]?.monthlyIncome || 0;

    // 📦 Send response
    res.status(200).json({
      message: "Dashboard stats fetched",
      totalConductors,
      activeConductorsToday,
      totalIncomeToday,
      monthlyIncome,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
