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
function getDBKey(appType) {
  const Pratima = ["Pratima"];
  const Trisojoyee = ["Trisojoyee"];
  if (Pratima.includes(appType)) return "Pratima";
  if (Trisojoyee.includes(appType)) return "Trisojoyee";
  // Default fallback
  return "Pratima";
}

function getConnection(appType) {
  const dbKey = getDBKey(appType);

  if (!connections[dbKey]) {
    const uri = process.env[`${dbKey}_DB_URL`];
    if (!uri) {
      throw new Error(`[getConnection] Missing DB URL for key: ${dbKey}_DB_URL`);
    }

    const conn = mongoose.createConnection(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

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
 * @param {string} appType - The app type to decide DB connection
 * @param {string} modelName - Name of the model
 */
function getModel(appType, modelName) {
  const conn = getConnection(appType);
  if (!conn.models[modelName]) {
    throw new Error(
      `Model "${modelName}" is not registered on connection for DB key: "${getDBKey(appType)}"`
    );
  }
  return conn.model(modelName);
}

export { getModel, getConnection };
