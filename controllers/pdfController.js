import PDFDocument from 'pdfkit';
import bwipjs from 'bwip-js';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

export const generateTicketWithBarcode = async (req, res) => {
  try {
    const { company_name, logo, bus_no, from, to, fare } = req.body;
    const ticketNo = Math.floor(1000000 + Math.random() * 9000000).toString();
    const barcodeData = `${ticketNo},${from}-${to}`;

    const barcodeBuffer = await bwipjs.toBuffer({
      bcid: 'code128',
      text: barcodeData,
      scale: 2,
      height: 10,
      includetext: true
    });

    // Disable default page and add custom sized one
    const doc = new PDFDocument({ autoFirstPage: false });

    // Adjust height here — tested value for thermal tickets:
    const calculatedHeight = 370; 
    doc.addPage({ size: [226, calculatedHeight], margin: 0 });

    const filePath = path.join('uploads', `${Date.now()}_ticket.pdf`);
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Company Name
    doc.fontSize(14).text(company_name, { align: 'center' });

    // Logo
    if (logo) {
      try {
        const response = await axios.get(logo, { responseType: 'arraybuffer' });
        const logoBuffer = Buffer.from(response.data);
        doc.image(logoBuffer, { fit: [100, 50], align: 'center' });
      } catch (err) {
        console.error("Logo fetch failed:", err.message);
      }
    }

    doc.fontSize(10).moveDown(0.5);
    doc.text(`Bus No: ${bus_no}`);
    doc.text(`Ticket No: ${ticketNo}`);
    doc.text(`Date & Time: ${new Date().toLocaleString()}`);
    doc.text(`From: ${from}`);
    doc.text(`To: ${to}`);
    doc.text(`Fare: ₹${fare}`);

    doc.moveDown(1);
    doc.image(barcodeBuffer, { width: 180, align: 'center' });

    doc.moveDown(0.5);
    doc.fontSize(10).text(`Thank You!`, { align: 'center' });
    doc.fontSize(10).text(company_name, { align: 'center' });

    doc.end();

    stream.on('finish', () => {
      res.status(200).json({
        message: 'Ticket PDF created successfully',
        pdf_url: `${process.env.BASE_URL}/${filePath}`
      });
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Ticket PDF generation failed' });
  }
};
