const mongoose = require("mongoose");

const productVariantSchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },

  attributes: {
    type: Map,
    of: String,
    default: {}
  },

  price: {
    type: Number,
    default: 0,
    min: 0
  },

  discount: {
    type: Number,
    default: 0,
    min: 0
  },

  stock: {
    type: Number,
    default: 0,
    min: 0
  },

  sku: {
    type: String,
    trim: true,
    default: ""
  },

  thumbnail: {
    type: String,
    trim: true,
    default: ""
  },

  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active"
  },

  deleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Indexing for performance
productVariantSchema.index({ product_id: 1 });
productVariantSchema.index({ sku: 1 }, { unique: true, sparse: true });
productVariantSchema.index({ deleted: 1, status: 1 });

const ProductVariant = mongoose.model(
  "ProductVariant",
  productVariantSchema,
  "product_variants"
);

module.exports = ProductVariant;