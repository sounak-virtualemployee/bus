import { getModel } from "../config/dbConnection.js";
// import Admin from "../models/Admin.js";
// import Conductor from "../models/Conductor.js";

const Admin = getModel("Pratima","Admin");
const Conductor = getModel("Pratima","Conductor");

export const checkNumber = async (req, res) => {
  try {
    const { number } = req.query;

    if (!number) {
      return res.status(400).json({ message: "Number is required" });
    }

    // Check Admin collection
    const admin = await Admin.findOne({ number });
    if (admin) {
      return res.status(200).json({
        message: "Admin found",
        type: "admin",
        data: {
          id: admin._id,
          number: admin.number,
          name: admin.name,
          company_name: admin.company_name,
          logo: admin.logo,
          roles: admin.roles,
        },
      });
    }

    // Check Conductor collection
    const conductor = await Conductor.findOne({ number: number });
    if (conductor) {
      return res.status(200).json({
        message: "Conductor found",
        type: "conductor",
        data: {
          id: conductor._id,
          name: conductor.name,
          busname: conductor.busname,
          busnumber: conductor.busnumber,
          routename: conductor.routename,
          company_name: conductor.company_name,
          logo: conductor.logo,
          number: conductor.number,
          roles: conductor.roles,
        },
      });
    }

    // If not found
    return res.status(404).json({ message: "Not valid number" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

