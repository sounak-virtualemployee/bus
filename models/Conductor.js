import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const conductorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  busname: {
    type: String,
    required: true,
  },
  busnumber: {
    type: String,
    required: true,
  },
  routename: {
    type: String,
    required: true,
  },
  number: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  company_name: {
    type: String,
    required: true,
  },
  logo: {
    type: String,
    default: '',
  },
   roles: {
    type: String,
    default: 'conductor'
  },
});

// Hash password before saving
conductorSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const Conductor = mongoose.model('Conductor', conductorSchema);

export default Conductor;
