const mongoose = require("mongoose");
const Product = require("../models/products.model");
require("dotenv").config();

(async () => {
  try {
    await mongoose.connect(process.env.MONG_URL);

    await Product.updateMany(
      { description: { $exists: false } },
      { $set: { description: "" } }
    );

    // console.log("Done!");
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
