/**
 * Seed Settings Script
 * Chạy: node scripts/seed-settings.js
 * 
 * Insert dữ liệu mặc định vào collection settings.
 * Nếu đã có data → skip, không ghi đè.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Setting = require("../models/setting.model");
const { SEED_DEFAULTS } = require("../services/admin/setting.service");

async function seed() {
  const mongoUrl = process.env.MONG_URL;
  if (!mongoUrl) {
    console.error("MONG_URL is not defined in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUrl);
    console.log("[Seed] Connected to MongoDB.");

    const existing = await Setting.findOne({ singletonKey: "site" }).lean();
    if (existing) {
      console.log("[Seed] Settings already exist — skipping.");
      console.log("[Seed] Current siteName:", existing.siteName);
    } else {
      const created = await Setting.create(SEED_DEFAULTS);
      console.log("[Seed] Default settings created successfully!");
      console.log("[Seed] siteName:", created.siteName);
    }
  } catch (error) {
    console.error("[Seed] Error:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("[Seed] Disconnected from MongoDB.");
  }
}

seed();
