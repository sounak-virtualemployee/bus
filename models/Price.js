// models/Fare.js
import mongoose from 'mongoose';

const priceSchema = new mongoose.Schema({
  path: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Path',
    required: true,
  },
  company_name: {
    type: String,
    required: true,
  },
  normal: {
    type: Map,
    of: Number,
    default: {}
  },
  reverse: {
    type: Map,
    of: Number,
    default: {}
  }
});

const Fare = mongoose.model('Price', priceSchema);
export default priceSchema;
