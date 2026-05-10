const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    note: String,
    totalPrice: Number,
    orderCode: {
      type: String,
      unique: true,
      required: true,
    },
    userInfo: {
      fullName: String,
      phone: String,
      address: {
        wardCode: String,
        wardName: String,
        districtCode: String,
        districtName: String,
        provinceCode: String,
        provinceName: String,
        street: String,
      },
    },
    paymentMethod: {
      type: String,
      enum: ["cod", "vnpay"],
    },
    paymentChannel: {
      type: String,
      default: "",
      trim: true,
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    products: [
      {
        product_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        variant_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ProductVariant",
          default: null,
        },
        title: String,
        thumbnail: String,
        price: Number,
        discountPercentage: Number,
        priceNew: Number,
        finalPrice: Number,
        quantity: Number,
      },
    ],
    status: {
      type: String,
      enum: [
        "chờ xác nhận",
        "đã xác nhận",
        "đang giao",
        "đã giao",
        "đã hủy",
      ],
      default: "chờ xác nhận",
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "expired"],
      default: "pending",
    },
    stockReservationStatus: {
      type: String,
      enum: ["reserved", "released", "consumed"],
      default: "consumed",
    },
    reservedAt: Date,
    expiresAt: Date,
    paidAt: Date,
    failedAt: Date,
    releasedAt: Date,
    paymentMeta: {
      provider: {
        type: String,
        default: "",
      },
      vnpCreateDate: Number,
      vnpExpireDate: Number,
      providerTransactionNo: {
        type: String,
        default: "",
      },
      providerBankCode: {
        type: String,
        default: "",
      },
      providerCardType: {
        type: String,
        default: "",
      },
      providerPayDate: {
        type: String,
        default: "",
      },
      lastResponseCode: {
        type: String,
        default: "",
      },
      lastTransactionStatus: {
        type: String,
        default: "",
      },
      lastWebhookAt: Date,
      lastReturnAt: Date,
      webhookPayload: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      returnPayload: {
        type: mongoose.Schema.Types.Mixed,
        default: null,
      },
      reconciliation: {
        lastCheckedAt: Date,
        lastStatus: {
          type: String,
          default: "",
        },
        note: {
          type: String,
          default: "",
        },
      },
    },
  },
  {
    timestamps: true,
  },
);

orderSchema.index({ user_id: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1, paymentMethod: 1, expiresAt: 1 });
orderSchema.index({ "userInfo.phone": 1 });
orderSchema.index({ "userInfo.fullName": 1 });
orderSchema.index({ deleted: 1, createdAt: -1 });

const Order = mongoose.model("Order", orderSchema, "orders");
module.exports = Order;
