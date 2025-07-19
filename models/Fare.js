import mongoose from 'mongoose';

const fareSchema = new mongoose.Schema({
  route_name: {
    type: String,
    required: true,
    unique: true
  },
  path: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Path',
    required: true
  },
  fares: {
    type: [Number],
    required: true,
    validate: {
      validator: val => val.length > 0,
      message: 'At least one fare is required'
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

const Fare = mongoose.model('Fare', fareSchema);
export default Fare;
