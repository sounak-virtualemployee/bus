import PDFDocument from 'pdfkit';
import bwipjs from 'bwip-js';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import Ticket from '../models/Ticket.js';

export const generateTicket = async (req, res) => {
  try {
    const { company_name, logo, bus_no, from, to, fare, count } = req.body;

    const ticketNo = Math.floor(1000000 + Math.random() * 9000000).toString();
    const barcodeData = `${ticketNo},${from}-${to}`;

    const barcodeBuffer = await bwipjs.toBuffer({
      bcid: 'code128',
      text: barcodeData,
      scale: 2,
      height: 10,
      includetext: true,
    });

    const doc = new PDFDocument({ autoFirstPage: false });
    const pageHeight = 440;
    doc.addPage({ size: [226, pageHeight], margin: 0 });

    const filePath = path.join('uploads', `${Date.now()}_ticket.pdf`);
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // HEADER
    doc.fontSize(14).text(company_name, { align: 'center' });

    // Optional Logo
    if (logo) {
      try {
        const response = await axios.get(logo, { responseType: 'arraybuffer' });
        const logoBuffer = Buffer.from(response.data);
        doc.image(logoBuffer, doc.page.width / 2 - 50, doc.y + 5, { width: 100 });
      } catch (err) {
        console.error("Logo fetch failed:", err.message);
      }
    }

    doc.moveDown(1);
    doc.fontSize(12).text(`Bus No: ${bus_no}`, { align: 'center' });

    doc.moveDown(0.5);
    doc.fontSize(10);
    doc.text(`Ticket No: ${ticketNo}`, { align: 'center' });
    doc.text(`Date & Time: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.text(`From: ${from}`, { align: 'center' });
    doc.text(`To: ${to}`, { align: 'center' });
    doc.text(`Passengers: ${count}`, { align: 'center' });

    // PRICING
    const baseFare = parseFloat(fare) * parseInt(count);
    const gst = parseFloat((baseFare * 0.05).toFixed(2));
    const total = parseFloat((baseFare + gst).toFixed(2));

    doc.moveDown(0.5);
    doc.text(`Fare (₹${fare} x ${count}): ₹${baseFare.toFixed(2)}`, { align: 'center' });
    doc.text(`GST @ 5%: ₹${gst.toFixed(2)}`, { align: 'center' });
    doc.font('Helvetica-Bold').text(`Total Fare: ₹${total.toFixed(2)}`, { align: 'center' });
    doc.font('Helvetica');

    // BARCODE
    doc.moveDown(1);
    const barcodeWidth = 180;
    const barcodeX = (doc.page.width - barcodeWidth) / 2;
    const barcodeY = doc.page.height - 90;
    doc.image(barcodeBuffer, barcodeX, barcodeY, { width: barcodeWidth });

    // FOOTER
    doc.moveDown(1.5);
    doc.fontSize(10).text(`Thank You!`, { align: 'center' });
    doc.text(company_name, { align: 'center' });

    doc.end();

    stream.on('finish', async () => {
      const ticket = new Ticket({
        ticket_no: ticketNo,
        company_name,
        bus_no,
        from,
        to,
        count,
        fare: baseFare,
        gst,
        total
      });

      await ticket.save();

      res.status(200).json({
        message: 'Ticket PDF generated successfully',
        pdf_url: `${process.env.BASE_URL}/${filePath}`,
        ticket_no: ticketNo,
        total_fare: total,
      });
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ticket generation failed' });
  }
};
