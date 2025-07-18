import Path from "../models/Path.js";

export const createPath = async (req, res) => {
  try {
    const { route_name, start, points } = req.body;
    const adminCompanyName = req.admin.company_name;
    const adminLogo = req.admin.logo;

    // Validation
    if (!route_name || !start || !points || !Array.isArray(points) || points.length === 0) {
      return res.status(400).json({ message: 'All fields are required: route_name, start, and points[]' });
    }

    // Check for duplicate route name under the same company
    const existingPath = await Path.findOne({
      route_name,
      company_name: adminCompanyName
    });

    if (existingPath) {
      return res.status(400).json({ message: 'Route name already exists under your company' });
    }

    const path = new Path({
      route_name,
      start,
      points,
      company_name: adminCompanyName,
      logo: adminLogo
    });

    await path.save();

    res.status(201).json({
      message: 'Path created successfully',
      path
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllPaths = async (req, res) => {
  try {
    const adminCompanyName = req.admin.company_name;

    const paths = await Path.find({ company_name: adminCompanyName });

    res.status(200).json({
      message: 'Paths fetched successfully',
      total: paths.length,
      paths
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPathById = async (req, res) => {
  try {
    const { id } = req.query;
    const adminCompanyName = req.admin.company_name;

    const path = await Path.findOne({
      _id: id,
      company_name: adminCompanyName
    });

    if (!path) {
      return res.status(404).json({ message: 'Path not found or unauthorized' });
    }

    res.status(200).json({
      message: 'Path fetched successfully',
      path
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updatePathById = async (req, res) => {
  try {
    const { id } = req.query;
    const adminCompanyName = req.admin.company_name;

    const path = await Path.findOne({
      _id: id,
      company_name: adminCompanyName
    });

    if (!path) {
      return res.status(404).json({ message: 'Path not found or unauthorized' });
    }

    const { route_name, start, points } = req.body;

    if (route_name !== undefined) path.route_name = route_name;
    if (start !== undefined) path.start = start;
    if (Array.isArray(points)) path.points = points;

    await path.save();

    res.status(200).json({
      message: 'Path updated successfully',
      path
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deletePathById = async (req, res) => {
  try {
    const { id } = req.query;
    const adminCompanyName = req.admin.company_name;

    const path = await Path.findOne({
      _id: id,
      company_name: adminCompanyName
    });

    if (!path) {
      return res.status(404).json({ message: 'Path not found or unauthorized' });
    }

    await path.deleteOne();

    res.status(200).json({ message: 'Path deleted successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

/// for conductor 

export const getPointsListByRouteName = async (req, res) => {
  try {
    const { route_name } = req.query;

    if (!route_name) {
      return res.status(400).json({ message: 'Route name is required' });
    }

    const conductorCompanyName = req.conductor.company_name;

    const path = await Path.findOne({
      route_name,
      company_name: conductorCompanyName
    });

    if (!path) {
      return res.status(404).json({ message: 'Route not found or unauthorized' });
    }

    // Build ordered point list: [start, ...points.end] with no fare
    const allPoints = [path.start, ...path.points.map(point => point.end)];

    res.status(200).json({
      message: 'Points list fetched successfully',
      points: allPoints
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const calculateFare = async (req, res) => {
  try {
    const { route_name, from, to } = req.body;
    const company_name = req.conductor.company_name;

    const path = await Path.findOne({ route_name, company_name });

    if (!path) {
      return res.status(404).json({ message: 'Route not found' });
    }

    const routePoints = [{ end: path.start, fare: 0 }, ...path.points];

    const fromIndex = routePoints.findIndex(p => p.end === from);
    const toIndex = routePoints.findIndex(p => p.end === to);

    if (fromIndex === -1 || toIndex === -1) {
      return res.status(400).json({ message: 'Invalid from/to point' });
    }

    let totalFare = 0;

    if (fromIndex < toIndex) {
      for (let i = fromIndex + 1; i <= toIndex; i++) {
        totalFare += routePoints[i].fare;
      }
    } else if (fromIndex > toIndex) {
      for (let i = fromIndex; i > toIndex; i--) {
        totalFare += routePoints[i].fare;
      }
    } else {
      totalFare = 0;
    }

    res.status(200).json({ total_fare: totalFare });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
