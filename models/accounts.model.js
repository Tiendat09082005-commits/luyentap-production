const mongoose = require("mongoose");
const generateHelper = require("../helpers/generate");

const accountSchema = new mongoose.Schema(
  {
    fullName: String,

    email: {
      type: String,
      required: true,
    },

    password: String,

    token: {
      type: String,
      default: () => generateHelper.generateRandomString(20),
    },

    phone: String,
    avatar: String,

    role_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
    },

    status: String,

    deleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: Date,
  },
  {
    timestamps: true,
  }
);

// ✅ unique theo email + deleted
accountSchema.index({ email: 1, deleted: 1 }, { unique: true });

// các index khác
accountSchema.index({ token: 1 });
accountSchema.index({ deleted: 1, status: 1 });
accountSchema.index({ fullName: "text", email: "text" });
accountSchema.index({ role_id: 1 });
accountSchema.index({ createdAt: -1 });

const Account = mongoose.model("Account", accountSchema, "accounts");

module.exports = Account;