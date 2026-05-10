const mongoose = require("mongoose");
const slug = require("mongoose-slug-updater");

mongoose.plugin(slug);

const brandSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },

  slug: {
    type: String,
    slug: "title"
  },

  logo: {
    type: String,
    trim: true
  },

  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },

  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active"
  },

  deleted: {
    type: Boolean,
    default: false
  },

  deletedAt: Date

}, {
  timestamps: true
});



brandSchema.index(
  { slug: 1, deleted: 1 },
  { unique: true }
);


brandSchema.index({ deleted: 1, status: 1 });
brandSchema.index({ createdAt: -1 });


brandSchema.index({ title: "text" });

const Brand = mongoose.model("Brand", brandSchema, "brands");

module.exports = Brand;