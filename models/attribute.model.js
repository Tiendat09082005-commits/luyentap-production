const mongoose = require("mongoose");
const slug = require("mongoose-slug-updater");

mongoose.plugin(slug);

const attributeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },

  slug: {
    type: String,
    slug: "title"
  },

  code: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },

  values: [
    {
      type: String,
      trim: true
    }
  ],

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



attributeSchema.index(
  { code: 1, deleted: 1 },
  { unique: true }
);

attributeSchema.index(
  { slug: 1, deleted: 1 },
  { unique: true }
);



attributeSchema.index({ deleted: 1, status: 1 });
attributeSchema.index({ createdAt: -1 });

const Attribute = mongoose.model("Attribute", attributeSchema, "attributes");

module.exports = Attribute;