import Admin from "../models/Admin.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
