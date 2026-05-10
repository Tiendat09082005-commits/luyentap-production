const mongoose = require("mongoose");
const slug = require("mongoose-slug-updater");
const { DEFAULT_CATEGORY_ICON, normalizeCategoryIcon } = require("../config/category-icons");

mongoose.plugin(slug);

const productCategorySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },

  parent_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductCategory",
    default: null,
    index: true
  },

  description: String,

  thumbnail: {
    type: String,
    trim: true,
    default: "",
  },

  icon: {
    type: String,
    default: DEFAULT_CATEGORY_ICON,
    trim: true,
    set: normalizeCategoryIcon,
  },

  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active"
  },

  position: {
    type: Number,
    default: 0
  },

  slug: {
    type: String,
    slug: "title",
    unique: true
  },

  deleted: {
    type: Boolean,
    default: false
  },

  deletedAt: Date

}, {
  timestamps: true
});

// Indexing for performance
productCategorySchema.index({ deleted: 1, status: 1, position: 1 });

const ProductCategory = mongoose.model(
  "ProductCategory",
  productCategorySchema,
  "products-category"
);

module.exports = ProductCategory;
