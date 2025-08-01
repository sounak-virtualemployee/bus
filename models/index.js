import adminSchema from "./Admin.js";
import conductorSchema from "./Conductor.js";
import fareSchema from "./Fare.js";
import pathSchema from "./Path.js";
import priceSchema from "./Price.js";
import ticketSchema from "./Ticket.js";

const schemas = {
    Admin: adminSchema,
    Conductor:conductorSchema,
    Fare:fareSchema,
    Path:pathSchema,
    Ticket:ticketSchema,
    Price:priceSchema
}
export default schemas;