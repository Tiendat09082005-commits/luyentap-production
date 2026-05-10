const mongoose = require("mongoose");
const Product = require("../models/products.model"); // hoặc product.model nếu đúng tên

(async () => {
  try {
    // 🔧 Kết nối DB của bạn (sửa tên DB cho đúng)
    await mongoose.connect(process.env.MONG_URL);

    // 🧩 Thêm trường deleted = true cho tất cả
    const result = await Product.updateMany({}, { $set: { deleted: false } });

    console.log("✅ Kết quả update:", result);
  } catch (error) {
    console.error("❌ Lỗi:", error);
  } finally {
    mongoose.connection.close();
  }
})();
