// controllers/fareController.js
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { getModel } from '../config/dbConnection.js';
import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
import { fileURLToPath } from 'url';
// ⬇️ adjust this import to wherever your getModel comes from


const BASE_URL = process.env.DOMAIN;

export const generateFareTemplates = async (req, res) => {
  const dbName = req.admin.company_name;
  const Path = getModel("Pratima", 'Path');

  try {
    const pathDoc = await Path.findOne({
      _id: req.params.pathId,
      company_name: dbName,
    });

    if (!pathDoc) {
      return res.status(404).json({ message: 'Path not found' });
    }

    const points = pathDoc.points;
    const first = points[0];
    const last = points[points.length - 1];

    const folder = path.join('public', 'fare-templates');
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });

    const normalFileName = `${first}_to_${last}_normal.xlsx`;
    const reverseFileName = `${last}_to_${first}_reverse.xlsx`;

    const normalPath = path.join(folder, normalFileName);
    const reversePath = path.join(folder, reverseFileName);

    const generateExcel = async (list, isReverse, filePath) => {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet(isReverse ? 'Reverse Fare' : 'Normal Fare');

      // First row (header): blank cell + point names
      sheet.addRow(['', ...list]);

      // Each row: point as label + empty cells
     for (let i = 0; i < list.length; i++) {
  const row = [list[i]];
  for (let j = 0; j < list.length; j++) {
    if (i === j) {
      row.push('-'); // same point, no fare
    } else if (j > i) {
      row.push('');  // editable cell (downward direction only)
    } else {
      row.push(null); // upper triangle ignored
    }
  }
  sheet.addRow(row);
}


      await workbook.xlsx.writeFile(filePath);
    };

    await generateExcel(points, false, normalPath);
    await generateExcel([...points].reverse(), true, reversePath);

    res.status(200).json({
      message: 'Fare templates created',
      normalFareSheet: `${BASE_URL}/public/fare-templates/${normalFileName}`,
      reverseFareSheet: `${BASE_URL}/public/fare-templates/${reverseFileName}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate fare templates' });
  }
};

export const uploadFareExcel = async (req, res) => {
  const dbName = req.admin.company_name;
  const Fare = getModel("Pratima", 'Price');
  const Path = getModel("Pratima", 'Path');
  const { pathId } = req.body;

  try {
    const [normalFile, reverseFile] = req.files;

    const pathDoc = await Path.findOne({ _id: pathId, company_name: dbName });
    if (!pathDoc) return res.status(404).json({ message: 'Path not found' });

    const points = pathDoc.points;

    const extractFareMap = async (file, points) => {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(file.path);
      const sheet = workbook.worksheets[0];

      if (!sheet) throw new Error(`Sheet not found in file: ${file.originalname}`);

      const fareMap = new Map();

      for (let i = 0; i < points.length; i++) {
        const from = points[i];

        for (let j = 0; j < points.length; j++) {
          const to = points[j];
          if (from === to) continue;

          const row = sheet.getRow(i + 2); // row 2 onwards = data
          const fare = row.getCell(j + 2).value; // column 2 onwards = fares

          if (fare !== null && fare !== '' && fare !== '-' && !isNaN(Number(fare))) {
            fareMap.set(`${from}|${to}`, Number(fare));
          }
        }
      }

      return Object.fromEntries(fareMap);
    };

    const normalFare = await extractFareMap(normalFile, points);
    const reverseFare = await extractFareMap(reverseFile, [...points].reverse());

    const existing = await Fare.findOne({ path: pathId, company_name: dbName });
    if (existing) {
      existing.normal = normalFare;
      existing.reverse = reverseFare;
      await existing.save();
    } else {
      await Fare.create({
        path: pathId,
        company_name: dbName,
        normal: normalFare,
        reverse: reverseFare,
      });
    }

    res.status(200).json({ message: '✅ Fare data uploaded successfully' });
  } catch (err) {
    console.error('❌ Fare Upload Error:', err);
    res.status(500).json({ message: '❌ Error uploading fare data', error: err.message });
  }
};

export const getFareAmount = async (req, res) => {
  const dbName = req.conductor.company_name;
  const Fare = getModel("Pratima", 'Price');
  const { pathId, from, to, reverse } = req.body;

  try {
    const fareDoc = await Fare.findOne({ path: pathId, company_name: dbName }).lean();
    if (!fareDoc) {
      return res.status(404).json({ message: 'Fare data not found' });
    }

    const clean = str => str.trim().replace(/\s+/g, ' ').toLowerCase();
    const inputKey = `${clean(from)}|${clean(to)}`;
    const altKey = `${clean(to)}|${clean(from)}`;

    // Normalize keys in both maps
    const normalizeFareMap = (obj = {}) => {
      const map = {};
      for (const key in obj) {
        const normalizedKey = key
          .split('|')
          .map(s => clean(s))
          .join('|');
        map[normalizedKey] = obj[key];
      }
      return map;
    };

    const normalMap = normalizeFareMap(fareDoc.normal);
    const reverseMap = normalizeFareMap(fareDoc.reverse);

    // Determine direction
    let fare = normalMap[inputKey];
    let direction = 'normal';

    if (fare === undefined) {
      fare = reverseMap[inputKey];
      direction = 'reverse';
    }

    if (fare === undefined) {
      return res.status(404).json({
        message: '❌ Fare not defined for this direction',
        inputKey,
        availableNormal: Object.keys(normalMap).slice(0, 10),
        availableReverse: Object.keys(reverseMap).slice(0, 10)
      });
    }

    return res.status(200).json({
      fare,
      direction,
      route: `${from} → ${to}`
    });

  } catch (err) {
    console.error('❌ Error fetching fare:', err);
    res.status(500).json({ message: '❌ Server error', error: err.message });
  }
};


// controllers/ticketExportController.js


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Public export dir (served by: app.use('/public', express.static('public')))
const EXPORT_DIR = path.join(__dirname, '..', 'public', 'exports');
fs.mkdirSync(EXPORT_DIR, { recursive: true });

const DOMAIN = process.env.DOMAIN || 'https://ticket.quicksparkz.in';

const toIST = (iso) => {
  const d = new Date(iso);
  const date_ist = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
  const time_ist = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(d);
  return { date_ist, time_ist };
};

export const createTicketsExcelLink = async (req, res) => {
  try {
    // tenant from your existing middleware
    const company_name = req.admin?.company_name;
    if (!company_name) {
      return res.status(401).json({ message: 'Unauthorized: company not found on token' });
    }

    // tenant-scoped model
    const Ticket = getModel(company_name, 'Ticket');

    // only conductor_id
    const { conductor_id } = req.body || {};
    if (!conductor_id || !mongoose.isValidObjectId(conductor_id)) {
      return res.status(400).json({ message: 'Valid conductor_id is required' });
    }

    // fetch all tickets for this conductor
    const query = { conductor_id: new mongoose.Types.ObjectId(conductor_id) };
    const tickets = await Ticket.find(query).sort({ createdAt: 1 }).lean();

    // workbook
    const wb = new ExcelJS.Workbook();
    wb.creator = 'TicketApp';
    wb.created = new Date();
    const ws = wb.addWorksheet('Tickets');

    ws.columns = [
      { header: 'Ticket No', key: 'ticket_no', width: 16 },
      { header: 'Company', key: 'company_name', width: 18 },
      { header: 'Bus No', key: 'bus_no', width: 14 },
      { header: 'From', key: 'from', width: 16 },
      { header: 'To', key: 'to', width: 16 },
      { header: 'Count', key: 'count', width: 8 },
      { header: 'Fare', key: 'fare', width: 10 },
      { header: 'Discount', key: 'discount', width: 10 },
      { header: 'Luggage', key: 'luggage', width: 10 },
      { header: 'Total', key: 'total', width: 10 },
      { header: 'Trip', key: 'trip', width: 10 },
      { header: 'Mobile', key: 'mobile', width: 16 },
      { header: 'Date (IST)', key: 'date_ist', width: 14 },
      { header: 'Time (IST)', key: 'time_ist', width: 14 },
      { header: 'Created At (ISO)', key: 'createdAt', width: 24 },
    ];
    ws.getRow(1).font = { bold: true };

    let sumFare = 0, sumDisc = 0, sumLug = 0, sumTotal = 0, sumCount = 0;

    for (const t of tickets) {
      const { date_ist, time_ist } = toIST(t.createdAt);
      ws.addRow({
        ticket_no: t.ticket_no,
        company_name: t.company_name,
        bus_no: t.bus_no,
        from: t.from,
        to: t.to,
        count: t.count ?? 0,
        fare: t.fare ?? 0,
        discount: t.discount ?? 0,
        luggage: t.luggage ?? 0,
        total: t.total ?? 0,
        trip: t.trip ?? '',
        mobile: t.mobile ?? '',
        date_ist,
        time_ist,
        createdAt: new Date(t.createdAt).toISOString(),
      });

      sumFare  += +t.fare || 0;
      sumDisc  += +t.discount || 0;
      sumLug   += +t.luggage || 0;
      sumTotal += +t.total || 0;
      sumCount += +t.count || 0;
    }

    if (tickets.length) {
      const r = ws.addRow({
        ticket_no: 'TOTALS',
        count: sumCount,
        fare: sumFare,
        discount: sumDisc,
        luggage: sumLug,
        total: sumTotal,
      });
      r.font = { bold: true };
    }

    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columnCount } };

    // filename + write
    const stamp = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date()).replace(/[/: ]/g, '-');

    const fname = `tickets_${company_name}_${conductor_id}_${stamp}_${nanoid(8)}.xlsx`;
    const filePath = path.join(EXPORT_DIR, fname);

    await fs.promises.writeFile(filePath, await wb.xlsx.writeBuffer());

    // public URL (served by app.use('/public', express.static('public')))
    const url = `${DOMAIN}/public/exports/${fname}`;
    return res.json({ url, filename: fname, count: tickets.length });
  } catch (err) {
    console.error('export link error:', err);
    return res.status(500).json({ message: 'Failed to create Excel link', error: err?.message });
  }
};




