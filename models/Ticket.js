import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  ticket_no: String,
  company_name: String,
  bus_no: String,
  from: String,
  to: String,
  count: Number,
  fare: Number,       // total fare (fare * count)
  gst: Number,        // 5% GST on fare
  total: Number,      // fare + gst
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Ticket', ticketSchema);
