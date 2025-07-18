import Conductor from "../models/Conductor.js";
import bcrypt from 'bcryptjs';

import jwt from 'jsonwebtoken';

export const createConductor = async (req, res) => {
  const admin = req.admin;
  try {
    const {
      name,
      busname,
      busnumber,
      routename,
      number,
      password,
      confirmpassword,
    } = req.body;

    // Check required fields
    if (
      !name ||
      !busname ||
      !busnumber ||
      !routename ||
      !number ||
      !password ||
      !confirmpassword
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check password match
    if (password !== confirmpassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Check for duplicate mobile number
    const existingConductor = await Conductor.findOne({ number });
    if (existingConductor) {
      return res
        .status(400)
        .json({ message: "Conductor with this mobile number already exists" });
    }

    // Create and save conductor
    const conductor = new Conductor({
      name,
      busname,
      busnumber,
      routename,
      number,
      password,
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
        routename: conductor.routename,
        number: conductor.number,
        company_name: conductor.company_name,
        logo: conductor.logo,
        roles:conductor.roles
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAllConductors = async (req, res) => {
  try {
    const adminCompanyName = req.admin.company_name;

    // Only get conductors created under the same admin company
    const conductors = await Conductor.find({ company_name: adminCompanyName });

    res.status(200).json({
      message: 'Conductors fetched successfully',
      total: conductors.length,
      conductors,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getConductorById = async (req, res) => {
  try {
    const { id } = req.query;

    // Make sure admin is authorized and company_name matches
    const adminCompanyName = req.admin.company_name;

    const conductor = await Conductor.findOne({
      _id: id,
      company_name: adminCompanyName
    });

    if (!conductor) {
      return res.status(404).json({ message: 'Conductor not found' });
    }

    res.status(200).json({
      message: 'Conductor fetched successfully',
      conductor
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateConductorById = async (req, res) => {
  try {
    const { id } = req.query;
    const adminCompanyName = req.admin.company_name;

    // Find conductor with matching company_name and ID
    const conductor = await Conductor.findOne({
      _id: id,
      company_name: adminCompanyName
    });

    if (!conductor) {
      return res.status(404).json({ message: 'Conductor not found or unauthorized' });
    }

    const {
      name,
      busname,
      busnumber,
      routename,
      number,
      password
    } = req.body;

    // Check for number duplication only if number is updated
    if (number && number !== conductor.number) {
      const existingConductor = await Conductor.findOne({
        number: number,
        company_name: adminCompanyName,
        _id: { $ne: id } // Exclude current conductor from check
      });

      if (existingConductor) {
        return res.status(400).json({ message: 'This number already exists for another conductor' });
      }

      conductor.number = number;
    }

    if (name !== undefined) conductor.name = name;
    if (busname !== undefined) conductor.busname = busname;
    if (busnumber !== undefined) conductor.busnumber = busnumber;
    if (routename !== undefined) conductor.routename = routename;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      conductor.password = await bcrypt.hash(password, salt);
    }

    await conductor.save();

    res.status(200).json({
      message: 'Conductor updated successfully',
      conductor
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteConductorById = async (req, res) => {
  try {
    const { id } = req.query;
    const adminCompanyName = req.admin.company_name;

    // Find conductor by ID and company_name
    const conductor = await Conductor.findOne({
      _id: id,
      company_name: adminCompanyName
    });

    if (!conductor) {
      return res.status(404).json({ message: 'Conductor not found or unauthorized' });
    }

    await conductor.deleteOne();

    res.status(200).json({ message: 'Conductor deleted successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const loginConductor = async (req, res) => {
  try {
    const { number } = req.query;
    const { password } = req.body;

    if (!number || !password) {
      return res.status(400).json({ message: 'Number and password are required' });
    }

    const conductor = await Conductor.findOne({ number });

    if (!conductor) {
      return res.status(404).json({ message: 'Conductor not found' });
    }

    const isMatch = await bcrypt.compare(password, conductor.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    const token = jwt.sign(
      { id: conductor._id, number: conductor.number, role: conductor.roles },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      conductor: {
        id: conductor._id,
        name: conductor.name,
        number: conductor.number,
        busname: conductor.busname,
        busnumber: conductor.busnumber,
        routename: conductor.routename,
        company_name: conductor.company_name,
        logo: conductor.logo,
        roles: conductor.roles
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};