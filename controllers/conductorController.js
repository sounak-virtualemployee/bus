import Conductor from "../models/Conductor.js";
import bcrypt from "bcryptjs";

import jwt from "jsonwebtoken";
import Path from "../models/Path.js";
import mongoose from "mongoose";

export const createConductor = async (req, res) => {
  const admin = req.admin;
  try {
    const {
      name,
      busname,
      busnumber,
      number,
      password,
      confirmpassword,
      path_id
    } = req.body;

    if (!name || !busname || !busnumber || !number || !password || !confirmpassword || !path_id) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmpassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const existing = await Conductor.findOne({ number });
    if (existing) {
      return res.status(400).json({ message: "Conductor with this mobile number already exists" });
    }

    const path = await Path.findById(path_id);
    if (!path || path.company_name !== admin.company_name) {
      return res.status(400).json({ message: "Invalid or unauthorized route selected" });
    }

    const conductor = new Conductor({
      name,
      busname,
      busnumber,
      number,
      password,
      path: path._id,
      company_name: admin.company_name,
      logo: admin.logo,
    });

    await conductor.save();

    res.status(201).json({
      message: "Conductor created successfully",
      conductor: {
        id: conductor._id,
        name: conductor.name,
        busname: conductor.busname,
        busnumber: conductor.busnumber,
        number: conductor.number,
        path: conductor.path,
        company_name: conductor.company_name,
        logo: conductor.logo,
        roles: conductor.roles
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllConductors = async (req, res) => {
  try {
    const adminCompanyName = req.admin.company_name;

    // Fetch conductors for the company and populate route details
    const conductors = await Conductor.find({ company_name: adminCompanyName })
      .populate({
        path: 'path',
        select: 'route_name ' // Select only needed fields from Path
      });

    res.status(200).json({
      message: "Conductors fetched successfully",
      total: conductors.length,
      conductors
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getConductorById = async (req, res) => {
  try {
    const { id } = req.query;
    const adminCompanyName = req.admin.company_name;

    // Find conductor by ID and match company, and populate the route
    const conductor = await Conductor.findOne({
      _id: id,
      company_name: adminCompanyName,
    }).populate({
      path: 'path',
      select: 'route_name '  // Fetch relevant route data
    });

    if (!conductor) {
      return res.status(404).json({ message: "Conductor not found or unauthorized" });
    }

    res.status(200).json({
      message: "Conductor fetched successfully",
      conductor,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateConductorById = async (req, res) => {
  try {
    const { id } = req.query;
    const adminCompanyName = req.admin.company_name;

    // Find conductor by ID and company
    const conductor = await Conductor.findOne({
      _id: id,
      company_name: adminCompanyName,
    });

    if (!conductor) {
      return res
        .status(404)
        .json({ message: "Conductor not found or unauthorized" });
    }

    const { name, busname, busnumber, path, number, password } = req.body;

    // If number changed, check for duplicates
    if (number && number !== conductor.number) {
      const existingConductor = await Conductor.findOne({
        number,
        company_name: adminCompanyName,
        _id: { $ne: id }, // exclude current conductor
      });

      if (existingConductor) {
        return res.status(400).json({
          message: "This number already exists for another conductor",
        });
      }

      conductor.number = number;
    }

    if (name !== undefined) conductor.name = name;
    if (busname !== undefined) conductor.busname = busname;
    if (busnumber !== undefined) conductor.busnumber = busnumber;
    if (path !== undefined) conductor.path = path;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      conductor.password = await bcrypt.hash(password, salt);
    }

    await conductor.save();

    res.status(200).json({
      message: "Conductor updated successfully",
      conductor,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteConductorById = async (req, res) => {
  try {
    const { id } = req.query;
    const adminCompanyName = req.admin.company_name;

    // Optional: Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid conductor ID" });
    }

    // Atomic delete + fetch
    const deletedConductor = await Conductor.findOneAndDelete({
      _id: id,
      company_name: adminCompanyName,
    });

    if (!deletedConductor) {
      return res.status(404).json({ message: "Conductor not found or unauthorized" });
    }

    res.status(200).json({
      message: "Conductor deleted successfully",
      conductor: {
        id: deletedConductor._id,
        name: deletedConductor.name,
        number: deletedConductor.number
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const loginConductor = async (req, res) => {
  try {
    const { number } = req.query;
    const { password } = req.body;

    if (!number || !password) {
      return res
        .status(400)
        .json({ message: "Number and password are required" });
    }

    // Find conductor and populate the path
    const conductor = await Conductor.findOne({ number }).populate("path");

    if (!conductor) {
      return res.status(404).json({ message: "Conductor not found" });
    }

    const isMatch = await bcrypt.compare(password, conductor.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    const token = jwt.sign(
      {
        id: conductor._id,
        number: conductor.number,
        role: conductor.roles,
        company_name: conductor.company_name,
        logo: conductor.logo,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      conductor: {
        id: conductor._id,
        name: conductor.name,
        number: conductor.number,
        busname: conductor.busname,
        busnumber: conductor.busnumber,
        path_id: conductor.path._id,
        route_name: conductor.path.route_name,
        company_name: conductor.company_name,
        logo: conductor.logo,
        roles: conductor.roles,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
