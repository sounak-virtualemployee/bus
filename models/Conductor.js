import mongoose from "mongoose";

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
  path: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Path",
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
    default: "",
  },
  roles: {
    type: String,
    default: "conductor",
  },
});

const Conductor = mongoose.model("Conductor", conductorSchema);

export default conductorSchema;
    