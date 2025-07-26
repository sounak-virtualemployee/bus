import mongoose from "mongoose";
import { getModel } from "../config/dbConnection.js";

export const generateTicket = async (req, res) => {
      const conductorCompanyName = req.conductor.company_name;

  try {
    const {
      company_name,
      ticket_no,
      bus_no,
      from,
      to,
      fare,
      count,
      total,
      conductor_id,
      mobile,
      discount,
      luggage,
    } = req.body;

    const Ticket = getModel(conductorCompanyName, "Ticket");

    const ticket = new Ticket({
      ticket_no,
      company_name,
      bus_no,
      from,
      to,
      mobile,
      count,
      fare,
      discount,
      luggage,
      total,
      conductor_id,
    });

    await ticket.save();

    res.status(200).json({
      message: "Ticket stored in database successfully",
      ticket_no,
      total_fare: total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Ticket generation failed" });
  }
};

export const getConductorMonthlySummary = async (req, res) => {
  try {
    const { conductor_id } = req.query;
    const company_name = req.admin.company_name;
    console.log(company_name);

    const Ticket = getModel(company_name, "Ticket");
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
        $addFields: {
          baseFare: { $multiply: ["$fare", "$count"] },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          totalBaseFare: { $sum: "$baseFare" },
          totalDiscount: { $sum: "$discount" },
          totalLuggage: { $sum: "$luggage" },
          totalIncome: { $sum: "$total" },
          totalTickets: { $sum: 1 },
        },
      },
      {
        $sort: { _id: -1 },
      },
    ]);

    res.status(200).json({
      message: "Daily conductor income fetched successfully",
      month: now.toLocaleString("default", { month: "long" }),
      dailySummary: dailySummary.map((entry) => ({
        date: entry._id,
        baseFare: entry.totalBaseFare,
        discount: entry.totalDiscount,
        luggage: entry.totalLuggage,
        totalIncome: entry.totalIncome,
        totalTickets: entry.totalTickets,
      })),
    });
  } catch (error) {
    console.error("Error fetching conductor monthly summary:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMonthlyTicketSummary = async (req, res) => {
  try {
    const { conductor_id } = req.query;
    const company_name = req.conductor.company_name;
    const Ticket = getModel(company_name, "Ticket");

    if (!conductor_id || !company_name) {
      return res
        .status(400)
        .json({ message: "conductor_id and company_name are required" });
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    const tickets = await Ticket.aggregate([
      {
        $match: {
          conductor_id: new mongoose.Types.ObjectId(conductor_id),
          company_name: company_name,
          createdAt: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $addFields: {
          day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          baseFare: { $multiply: ["$fare", "$count"] },
        },
      },
      {
        $group: {
          _id: "$day", // grouping key must be `_id`
          totalBaseFare: { $sum: "$baseFare" },
          totalLuggage: { $sum: "$luggage" },
          totalDiscount: { $sum: "$discount" },
          totalAmount: { $sum: "$total" },
        },
      },
      {
        $project: {
          date: "$_id", // rename `_id` to `date`
          _id: 0,
          totalBaseFare: 1,
          totalLuggage: 1,
          totalDiscount: 1,
          totalAmount: 1,
        },
      },
      { $sort: { date: -1 } },
    ]);

    return res.json({ success: true, data: tickets });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error", error });
  }
};

