import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  ticket_no: String,
  company_name: String,
  bus_no: String,
  from: String,
  to: String,
  count: Number,
  fare: Number,
  discount:Number,
  mobile:Number,
  luggage:Number,
  total: Number,
  conductor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conductor', // 🔗 This maps to the Conductor model
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
const Ticket = mongoose.model('Ticket', ticketSchema);

export default ticketSchema;
