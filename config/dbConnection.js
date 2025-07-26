import mongoose from "mongoose";
import schemas from "../models/index.js";
import dotenv from "dotenv";
dotenv.config();

const connections = {};

/**
 * Map appType to a DB key.
 * StarReward, Central, Sense => StarReward DB
 * Qantum, MaxGaming, Manly, Montauk => Qantum DB
 */
function getDBKey(company_name) {
  const Pratima = ["Pratima"];
  const Trisojoyee = ["Trisojoyee"];
  if (Pratima.includes(company_name)) return "Pratima";
  if (Trisojoyee.includes(company_name)) return "Trisojoyee";
  // Default fallback
  return "Pratima";
}

function getConnection(company_name) {
  const dbKey = getDBKey(company_name);

  if (!connections[dbKey]) {
    const uri = process.env[`${dbKey}_DB_URL`];
    if (!uri) {
      throw new Error(`[getConnection] Missing DB URL for key: ${dbKey}_DB_URL`);
    }

    const conn = mongoose.createConnection(uri);

    // Register all models in the connection
    Object.entries(schemas).forEach(([modelName, schema]) => {
      if (!schema || typeof schema !== "object" || !schema.obj) {
        throw new Error(`Invalid schema for model: ${modelName}`);
      }

      if (!conn.models[modelName]) {
        conn.model(modelName, schema);
      }
    });

    conn.on("connected", () => console.log(`MongoDB connected: ${dbKey}`));
    conn.on("error", (err) =>
      console.error(`MongoDB connection error [${dbKey}]:`, err)
    );

    connections[dbKey] = conn;
    console.log(`[getConnection] Created new connection for DB: ${dbKey}`);
  }

  return connections[dbKey];
}

/**
 * Get mongoose model from appropriate connection by appType
 * @param {string} company_name - The app type to decide DB connection
 * @param {string} modelName - Name of the model
 */
function getModel(company_name, modelName) {
  const conn = getConnection(company_name);
  if (!conn.models[modelName]) {
    throw new Error(
      `Model "${modelName}" is not registered on connection for DB key: "${getDBKey(company_name)}"`
    );
  }
  return conn.model(modelName);
}

export { getModel, getConnection };
