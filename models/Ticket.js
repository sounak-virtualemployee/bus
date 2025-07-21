import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  ticket_no: String,
  company_name: String,
  bus_no: String,
  from: String,
  to: String,
  count: Number,
  fare: Number,
  total: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Ticket', ticketSchema);
