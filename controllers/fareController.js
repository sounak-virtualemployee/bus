import { getModel } from "../config/dbConnection.js";

const Fare = getModel("Pratima", "Fare");
const Path = getModel("Pratima", "Path");

export const createFare = async (req, res) => {
  try {
    const { path_id, fares } = req.body;
    const company_name = req.admin.company_name;
    const logo = req.admin.logo;

    const path = await Path.findOne({ _id: path_id, company_name });

    if (!path) {
      return res.status(404).json({ message: 'Path not found for your company' });
    }

    const existing = await Fare.findOne({ path: path_id, company_name });
    if (existing) {
      return res.status(400).json({ message: 'Fare already exists for this path' });
    }

    const fare = new Fare({
      route_name: path.route_name,
      path: path._id,
      fares,
      company_name,
      logo
    });

    await fare.save();
    res.status(201).json({ message: 'Fare created successfully', fare });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
// controllers/fareController.js
export const getAllFares = async (req, res) => {
  try {
    const adminCompanyName = req.admin.company_name;

    const fares = await Fare.find({ company_name: adminCompanyName });

    res.status(200).json({
      message: 'Fare list fetched successfully',
      fares
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getFareById = async (req, res) => {
  try {
    const { id } = req.query;
    const adminCompanyName = req.admin.company_name;

    const fare = await Fare.findOne({
      _id: id,
      company_name: adminCompanyName
    });

    if (!fare) {
      return res.status(404).json({ message: 'Fare not found or unauthorized access' });
    }

    res.status(200).json({
      message: 'Fare fetched successfully',
      fare
    });

  } catch (error) {
    console.error('Error in getFareById:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateFareById = async (req, res) => {
  try {
    const { path_id, fares } = req.body;
    const company_name = req.admin.company_name;

    const fare = await Fare.findOne({ _id: req.query.id, company_name });
    if (!fare) {
      return res.status(404).json({ message: 'Fare not found or unauthorized' });
    }

    if (path_id) {
      const path = await Path.findOne({ _id: path_id, company_name });
      if (!path) return res.status(404).json({ message: 'Mapped path not found' });

      fare.path = path._id;
      fare.route_name = path.route_name;
    }

    if (fares) fare.fares = fares;

    await fare.save();
    res.status(200).json({ message: 'Fare updated', fare });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteFareById = async (req, res) => {
  try {
    const { id } = req.query;
    const adminCompanyName = req.admin.company_name;

    const fare = await Fare.findOneAndDelete({
      _id: id,
      company_name: adminCompanyName
    });

    if (!fare) {
      return res.status(404).json({ message: 'Fare not found or unauthorized access' });
    }

    res.status(200).json({
      message: 'Fare deleted successfully',
      fare
    });

  } catch (error) {
    console.error('Error in deleteFareById:', error);
    res.status(500).json({ message: 'Server error' });
  }
};