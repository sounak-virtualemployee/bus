import jwt from 'jsonwebtoken';
import Conductor from '../models/Conductor.js';


export const protectConductor = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.conductor = await Conductor.findById(decoded.id).select('-password');

      if (!req.conductor) {
        return res.status(401).json({ message: 'Not authorized as conductor' });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Invalid token' });
    }
  } else {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
};

export default protectConductor;
