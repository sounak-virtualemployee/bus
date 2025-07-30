import mongoose from "mongoose";
import { getModel } from "../config/dbConnection.js";

export const generateTicket = async (req, res) => {
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
      trip,
      luggage,
    } = req.body;

    const Ticket = getModel(company_name, "Ticket");
    console.log("Sounak");
    console.log(req.body);

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
      trip,
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
          recalculatedDiscount: {
            $subtract: [{ $multiply: ["$fare", "$count"] }, "$total"],
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          totalBaseFare: { $sum: "$baseFare" },
          totalDiscount: { $sum: "$recalculatedDiscount" },
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

// export const getMonthlyTicketSummary = async (req, res) => {
//   try {
//     const { conductor_id } = req.query;
//     const company_name = req.conductor.company_name;
//     const Ticket = getModel(company_name, "Ticket");

//     if (!conductor_id || !company_name) {
//       return res
//         .status(400)
//         .json({ message: "conductor_id and company_name are required" });
//     }

//     const now = new Date();
//     const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
//     const endOfMonth = new Date(
//       now.getFullYear(),
//       now.getMonth() + 1,
//       0,
//       23,
//       59,
//       59,
//       999
//     );

//     const data = await Ticket.aggregate([
//       {
//         $match: {
//           conductor_id: new mongoose.Types.ObjectId(conductor_id),
//           company_name,
//           createdAt: { $gte: startOfMonth, $lte: endOfMonth },
//         },
//       },
//       {
//         $addFields: {
//           day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
//           baseFare: { $multiply: ["$fare", "$count"] },
//         },
//       },
//       {
//         $group: {
//           _id: {
//             date: "$day",
//             trip: "$trip"
//           },
//           ticket_count: { $sum: "$count" },
//           base_fare: { $sum: "$baseFare" },
//           total_discount: { $sum: "$discount" },
//           total_income: { $sum: "$total" },
//           total_luggage: { $sum: "$luggage" },
//         },
//       },
//       {
//         $sort: { "_id.date": 1, "_id.trip": 1 }
//       }
//     ]);

//     // Restructure data: group by date, then by trip
//     const groupedByDate = {};
//     const total = {
//       ticket_count: 0,
//       base_fare: 0,
//       total_discount: 0,
//       total_income: 0,
//       total_luggage: 0
//     };

//     data.forEach(item => {
//       const { date, trip } = item._id;

//       // Accumulate overall total
//       total.ticket_count += item.ticket_count;
//       total.base_fare += item.base_fare;
//       total.total_discount += item.total_discount;
//       total.total_income += item.total_income;
//       total.total_luggage += item.total_luggage;

//       if (!groupedByDate[date]) {
//         groupedByDate[date] = [];
//       }

//       groupedByDate[date].push({
//         trip,
//         ticket_count: item.ticket_count,
//         base_fare: item.base_fare,
//         total_discount: item.total_discount,
//         total_income: item.total_income,
//         total_luggage: item.total_luggage
//       });
//     });

//     const dailySummary = Object.keys(groupedByDate).map(date => ({
//       date,
//       trips: groupedByDate[date]
//     }));

//     return res.json({
//       success: true,
//       message: "Monthly ticket summary by day and trip fetched successfully",
//       month: now.toLocaleString("default", { month: "long" }),
//       dailySummary,
//       total
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ message: "Server error", error });
//   }
// };

export const getMonthlyTicketSummary = async (req, res) => {
  try {
    const { conductor_id, date } = req.query;
    const company_name = req.conductor.company_name;
    const Ticket = getModel(company_name, "Ticket");

    if (!conductor_id || !date) {
      return res
        .status(400)
        .json({ message: "Conductor ID and date are required" });
    }

    const targetDate = new Date(date);
    const nextDate = new Date(targetDate);
    nextDate.setDate(targetDate.getDate() + 1);

    const tripSummary = await Ticket.aggregate([
      {
        $match: {
          company_name,
          conductor_id: new mongoose.Types.ObjectId(conductor_id),
          createdAt: { $gte: targetDate, $lt: nextDate },
        },
      },
      {
        $addFields: {
          base_fare: { $multiply: ["$fare", "$count"] },
        },
      },
      {
        $facet: {
          tripData: [
            {
              $group: {
                _id: "$trip",
                ticket_count: { $sum: "$count" },
                base_fare: { $sum: "$base_fare" },
                total_discount: { $sum: "$discount" },
                total_income: { $sum: "$total" },
                total_luggage: { $sum: "$luggage" },
              },
            },
            { $sort: { _id: 1 } },
          ],
          routeData: [
            {
              $group: {
                _id: { trip: "$trip", from: "$from", to: "$to" },
                count: { $sum: "$count" },
              },
            },
            {
              $group: {
                _id: "$_id.trip",
                routes: {
                  $push: {
                    from: "$_id.from",
                    to: "$_id.to",
                    count: "$count",
                  },
                },
              },
            },
          ],
        },
      },
      {
        $project: {
          tripData: 1,
          routeData: 1,
        },
      },
    ]);

    const trips = tripSummary[0].tripData;
    const routes = tripSummary[0].routeData;

    const merged = trips.map((trip) => {
      const routeMatch = routes.find((r) => r._id === trip._id);
      return {
        trip: trip._id,
        ticket_count: trip.ticket_count,
        base_fare: trip.base_fare,
        total_discount: trip.total_discount,
        total_income: trip.total_income,
        total_luggage: trip.total_luggage,
        routes: routeMatch ? routeMatch.routes : [],
      };
    });

    const totals = merged.reduce(
      (acc, trip) => {
        acc.ticket_count += trip.ticket_count;
        acc.base_fare += trip.base_fare;
        acc.total_discount += trip.total_discount;
        acc.total_income += trip.total_income;
        acc.total_luggage += trip.total_luggage;
        return acc;
      },
      {
        ticket_count: 0,
        base_fare: 0,
        total_discount: 0,
        total_income: 0,
        total_luggage: 0,
      }
    );

    res.status(200).json({
      message: "Trip-wise summary fetched successfully",
      date: targetDate.toISOString().split("T")[0],
      tripSummary: merged,
      total: totals,
    });
  } catch (error) {
    console.error("Error fetching trip summary:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getConductorTripSummaryByDate = async (req, res) => {
  try {
    const { conductor_id, date } = req.query;
    const company_name = req.admin.company_name;
    const Ticket = getModel(company_name, "Ticket");
    const Conductor = getModel(company_name, "Conductor");
    if (!conductor_id || !date) {
      return res
        .status(400)
        .json({ message: "Conductor ID and date are required" });
    }
const conductor = await Conductor.findOne({ _id: conductor_id }).select("name");

    const targetDate = new Date(date);
    const nextDate = new Date(targetDate);
    nextDate.setDate(targetDate.getDate() + 1);

    const tripSummary = await Ticket.aggregate([
      {
        $match: {
          company_name,
          conductor_id: new mongoose.Types.ObjectId(conductor_id),
          createdAt: { $gte: targetDate, $lt: nextDate },
        },
      },
      {
        $addFields: {
          base_fare: { $multiply: ["$fare", "$count"] },
        },
      },
      {
        $facet: {
          // 1. Trip-wise summary
          tripData: [
            {
              $group: {
                _id: "$trip",
               conductorName:conductor,
                ticket_count: { $sum: "$count" },
                base_fare: { $sum: "$base_fare" },
                total_discount: { $sum: "$discount" },
                total_income: { $sum: "$total" },
                total_luggage: { $sum: "$luggage" },
              },
            },
            { $sort: { _id: 1 } },
          ],

          // 2. Routes per trip (with count + total)
          routeData: [
            {
              $group: {
                _id: { trip: "$trip", from: "$from", to: "$to" },
                count: { $sum: "$count" },
                total: { $sum: "$total" },
              },
            },
            {
              $group: {
                _id: "$_id.trip",
                routes: {
                  $push: {
                    from: "$_id.from",
                    to: "$_id.to",
                    count: "$count",
                    total: "$total",
                  },
                },
              },
            },
          ],
        },
      },
      {
        $project: {
          tripData: 1,
          routeData: 1,
        },
      },
    ]);

    const trips = tripSummary[0].tripData;
    const routes = tripSummary[0].routeData;

    const merged = trips.map((trip) => {
      const routeMatch = routes.find((r) => r._id === trip._id);
      return {
        trip: trip._id,
        ticket_count: trip.ticket_count,
        base_fare: trip.base_fare,
        total_discount: trip.total_discount,
        total_income: trip.total_income,
        total_luggage: trip.total_luggage,
        routes: routeMatch ? routeMatch.routes : [],
      };
    });

    const totals = merged.reduce(
      (acc, trip) => {
        acc.ticket_count += trip.ticket_count;
        acc.base_fare += trip.base_fare;
        acc.total_discount += trip.total_discount;
        acc.total_income += trip.total_income;
        acc.total_luggage += trip.total_luggage;
        return acc;
      },
      {
        ticket_count: 0,
        base_fare: 0,
        total_discount: 0,
        total_income: 0,
        total_luggage: 0,
      }
    );

    res.status(200).json({
      message: "Trip-wise summary fetched successfully",
      date: targetDate.toISOString().split("T")[0],
      tripSummary: merged,
      total: totals,
    });
  } catch (error) {
    console.error("Error fetching trip summary:", error);
    res.status(500).json({ message: "Server error" });
  }
};
