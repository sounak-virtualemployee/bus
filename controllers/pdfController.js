import mongoose from 'mongoose';
import Ticket from '../models/Ticket.js';

export const generateTicket = async (req, res) => {
  try {
    const { company_name, ticket_no, bus_no, from, to, fare, count,total,conductor_id } = req.body;

    const ticket = new Ticket({
      ticket_no,
      company_name,
      bus_no,
      from,
      to,
      count,
      fare,
      total,
      conductor_id
    });

    await ticket.save();

    res.status(200).json({
      message: 'Ticket stored in database successfully',
      ticket_no,
      total_fare: total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ticket generation failed' });
  }
};

export const getConductorMonthlySummary = async (req, res) => {
  try {
    const { conductor_id } = req.query;
    const company_name = req.admin.company_name;

    if (!conductor_id) {
      return res.status(400).json({ message: "Conductor ID is required" });
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const dailySummary = await Ticket.aggregate([
      {
        $match: {
          company_name,
          conductor_id: new mongoose.Types.ObjectId(conductor_id),
          createdAt: { $gte: monthStart, $lt: nextMonthStart },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          totalIncome: { $sum: "$total" },
          totalTickets: { $sum: 1 },
        },
      },
      {
        $sort: { "_id": -1 },
      },
    ]);

    res.status(200).json({
      message: "Daily conductor income fetched successfully",
      month: now.toLocaleString("default", { month: "long" }),
      dailySummary: dailySummary.map(entry => ({
        date: entry._id,
        totalIncome: entry.totalIncome,
        totalTickets: entry.totalTickets,
      }))
    });
  } catch (error) {
    console.error("Error fetching conductor monthly summary:", error);
    res.status(500).json({ message: "Server error" });
  }
};