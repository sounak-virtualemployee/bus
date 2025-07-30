// controllers/fareController.js
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { getModel } from '../config/dbConnection.js';

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
  const Fare = getModel(dbName, 'Price');
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



