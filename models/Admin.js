import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminSchema = new mongoose.Schema({
  number: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  company_name: {
    type: String,
    required: true
  },
  logo: {
    type: String, // Example: URL or file path
    default: ''
  },
  roles: {
    type: String,
    default: 'admin'
  },
  password: {
    type: String,
    required: true
  }
});

// Hash password before saving
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const Admin = mongoose.model('Admin', adminSchema);

export default Admin;
