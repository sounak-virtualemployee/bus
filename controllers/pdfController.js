import Ticket from '../models/Ticket.js';

export const generateTicket = async (req, res) => {
  try {
    const { company_name, ticket_no, bus_no, from, to, fare, count,total } = req.body;

    const ticket = new Ticket({
      ticket_no,
      company_name,
      bus_no,
      from,
      to,
      count,
      fare,
      total
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
