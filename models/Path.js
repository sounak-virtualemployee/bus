import mongoose from 'mongoose';

const pathSchema = new mongoose.Schema({
  route_name: {
    type: String,
    required: true,
    unique: true,
  },
  points: {
    type: [String],
    required: true,
    validate: {
      validator: arr => arr.length > 1,
      message: 'At least two points are required for a path',
    }
  },
  company_name: {
    type: String,
    required: true
  },
  logo: {
    type: String,
    default: ''
  }
});

const Path = mongoose.model('Path', pathSchema);
export default Path;
