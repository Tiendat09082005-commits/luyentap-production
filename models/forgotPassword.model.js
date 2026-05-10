const mongoose = require("mongoose");

const forgotPasswordSchema = new mongoose.Schema(
  {
    email: String,
    otp: String,
    expireAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexing for performance
// TTL index: tự động xóa bản ghi sau khi hết hạn
forgotPasswordSchema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
forgotPasswordSchema.index({ email: 1, otp: 1 });

module.exports = mongoose.model(
  "ForgotPassword",
  forgotPasswordSchema,
  "forgot-password"
);