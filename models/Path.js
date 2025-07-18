import mongoose from 'mongoose';

const pointSchema = new mongoose.Schema({
  end: {
    type: String,
    required: true
  },
  fare: {
    type: Number,
    required: true
  }
});

const pathSchema = new mongoose.Schema({
  route_name: {
    type: String,
    required: true
  },
  start: {
    type: String,
    required: true
  },
  points: [pointSchema],
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
