import mongoose from "mongoose";
import { getModel } from "../config/dbConnection.js";
import Path from "../models/Path.js";
import Fare from "../models/Fare.js";

// Create Path
export const createPath = async (req, res) => {
  try {
    const { route_name, points } = req.body;
    const adminCompanyName = req.admin.company_name;

    if (!route_name || !points || !Array.isArray(points) || points.length < 2) {
      return res
        .status(400)
        .json({ message: "Route name and at least 2 points are required" });
    }

    const existing = await Path.findOne({
      route_name,
      company_name: adminCompanyName,
    });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Route name already exists under your company" });
    }

    const path = new Path({
      route_name,
      points,
      company_name: adminCompanyName,
    });

    await path.save();
    res.status(201).json({ message: "Path created successfully", path });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get All Paths
export const getAllPaths = async (req, res) => {
  try {
    const paths = await Path.find({ company_name: req.admin.company_name });
    res.status(200).json(paths);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get Path by ID
export const getPathById = async (req, res) => {
  try {
    const path = await Path.findOne({
      _id: req.query.id,
      company_name: req.admin.company_name,
    });
    if (!path) {
      return res.status(404).json({ message: "Path not found" });
    }
    res.status(200).json(path);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update Path by ID
export const updatePathById = async (req, res) => {
  try {
    const { route_name, points } = req.body;
    const { id } = req.query;

    const path = await Path.findOne({
      _id: id,
      company_name: req.admin.company_name,
    });
    if (!path) {
      return res
        .status(404)
        .json({ message: "Path not found or unauthorized" });
    }

    if (route_name !== undefined) path.route_name = route_name;
    if (points !== undefined && Array.isArray(points) && points.length >= 2) {
      path.points = points;
    }

    await path.save();
    res.status(200).json({ message: "Path updated successfully", path });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete Path
export const deletePathById = async (req, res) => {
  try {
    const { id } = req.query;
    const path = await Path.findOneAndDelete({
      _id: id,
      company_name: req.admin.company_name,
    });
    if (!path) {
      return res
        .status(404)
        .json({ message: "Path not found or unauthorized" });
    }
    res.status(200).json({ message: "Path deleted successfully", path });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/// for conductor

export const getPointsListByPathId = async (req, res) => {
  try {
    const { path_id } = req.query;

    if (!path_id || !mongoose.Types.ObjectId.isValid(path_id)) {
      return res.status(400).json({ message: "Valid path_id is required" });
    }

    const conductorCompanyName = req.conductor.company_name;

    const path = await Path.findOne({
      _id: path_id,
      company_name: conductorCompanyName,
    });

    if (!path) {
      return res
        .status(404)
        .json({ message: "Path not found or unauthorized" });
    }

    // Return points as per DB order
    res.status(200).json({
      message: "Points list fetched successfully",
      points: path.points,
    });
  } catch (error) {
    console.error("Error fetching points:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const calculateFareByPathId = async (req, res) => {
  try {
    const { path_id, from, to, journey } = req.body;
    const company_name = req.conductor.company_name;

    if (!path_id || !from || !to || !journey) {
      return res
        .status(400)
        .json({ message: "path_id, from, to, and journey are required" });
    }

    if (!["up", "down"].includes(journey.toLowerCase())) {
      return res
        .status(400)
        .json({ message: "Journey must be 'up' or 'down'" });
    }

    // 1. Find path with matching ID and company_name
    const path = await Path.findOne({ _id: path_id, company_name });
    if (!path) {
      return res
        .status(404)
        .json({ message: "Path not found or unauthorized" });
    }

    // 2. Handle direction
    const points = [...path.points];
    if (journey.toLowerCase() === "down") points.reverse();

    // 3. Find index of from and to
    const fromIndex = points.indexOf(from);
    const toIndex = points.indexOf(to);

    if (fromIndex === -1 || toIndex === -1) {
      return res.status(400).json({ message: "Invalid 'from' or 'to' point" });
    }

    if (fromIndex === toIndex) {
      return res
        .status(200)
        .json({ total_fare: 0, message: "Same pickup and drop points" });
    }

    const segmentCount = Math.abs(toIndex - fromIndex);
    const fareIndex = segmentCount - 1;

    // 4. Get fare
    const fareData = await Fare.findOne({ path: path_id, company_name });
    if (!fareData || !fareData.fares || fareIndex >= fareData.fares.length) {
      return res
        .status(404)
        .json({ message: "Fare not available for this segment" });
    }

    const totalFare = fareData.fares[fareIndex];

    res.status(200).json({
      from,
      to,
      journey: journey.toLowerCase(),
      total_fare: totalFare,
    });
  } catch (error) {
    console.error("Fare calculation error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
