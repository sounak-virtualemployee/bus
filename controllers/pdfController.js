import PDFDocument from 'pdfkit';
import bwipjs from 'bwip-js';
import fs from 'fs';
import path from 'path';

export const generateTicketWithBarcode = async (req, res) => {
  try {
    const { company_name, logo, bus_no, from, to, fare } = req.body;

    // Generate ticket number
    const ticketNo = Math.floor(1000000 + Math.random() * 9000000).toString();

    // Barcode content
    const barcodeData = `${ticketNo},${from}-${to}`;

    // Generate barcode buffer
    const barcodeBuffer = await bwipjs.toBuffer({
      bcid: 'code128',
      text: barcodeData,
      scale: 2,
      height: 10,
      includetext: true
    });

    // Create PDF
    const doc = new PDFDocument({ size: [226, 600] });
    const filePath = path.join('uploads', `${Date.now()}_ticket.pdf`);
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // Add company name and logo
    doc.fontSize(14).text(company_name, { align: 'center' });
    if (logo) {
      try {
        doc.image(logo, { fit: [100, 50], align: 'center' });
      } catch {
        // Ignore image error
      }
    }

    // Add ticket details
    doc.moveDown().fontSize(12).text(`Bus No: ${bus_no}`);
    doc.text(`Ticket No: ${ticketNo}`);
    doc.text(`Date & Time: ${new Date().toLocaleString()}`);
    doc.text(`From: ${from}`);
    doc.text(`To: ${to}`);
    doc.text(`Fare: ₹${fare}`);

    // Add barcode image
    doc.image(barcodeBuffer, { width: 180, align: 'center' });

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
