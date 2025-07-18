import PDFDocument from 'pdfkit';
import bwipjs from 'bwip-js';
import fs from 'fs';
import path from 'path';

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

    const doc = new PDFDocument({ size: [226, 600], margin: 10 });
    const filePath = path.join('uploads', `${Date.now()}_ticket.pdf`);
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Title & Logo
    doc.fontSize(14).text(company_name, { align: 'center' });
    if (logo) {
      try {
        doc.image(logo, { fit: [100, 50], align: 'center', valign: 'center' });
      } catch {
        // Ignore image errors
      }
    }

    // Draw structured box layout
    doc.fontSize(10);

    doc.moveDown(0.5);
    doc.text(`Bus No: ${bus_no}`, { align: 'left' });
    doc.text(`Ticket No: ${ticketNo}`, { align: 'left' });
    doc.text(`Date & Time: ${new Date().toLocaleString()}`, { align: 'left' });
    doc.text(`From: ${from}`, { align: 'left' });
    doc.text(`To: ${to}`, { align: 'left' });
    doc.text(`Fare: ₹${fare}`, { align: 'left' });

    // Barcode at the bottom
    doc.moveDown(1);
    doc.image(barcodeBuffer, { width: 180, align: 'center' });

    // Footer
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
