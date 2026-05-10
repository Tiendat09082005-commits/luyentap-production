const mongoose = require("mongoose");
const slug = require("mongoose-slug-updater");
mongoose.plugin(slug);

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    slug: {
      type: String,
      slug: "title",
      unique: true,
    },

    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductCategory",
    },

    brand_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
    },

    description: {
      type: String,
      default: "",
    },
    shortDescription: {
      type: String,
      default: "",
    },
    thumbnail: String,
    images: [String],

    attributes: [
      {
        attribute_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Attribute",
        },
        name: String,
        code: String,
        selectedValues: [String],
        useForVariant: {
          type: Boolean,
          default: false,
        },
        affectsImage: {
          type: Boolean,
          default: false,
        },
      },
    ],
    priceConfig: {
      type: Map,
      of: Object,
    },

    rating: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      default: "active",
    },

    position: Number,

    deleted: {
      type: Boolean,
      default: false,
    },
    specifications: [
      {
        groupName: {
          type: String,
          required: true,
          trim: true,
        },
        items: [
          {
            key: {
              type: String,
              required: true,
              trim: true,
            },
            value: {
              type: String,
              required: true,
              trim: true,
            },
          },
        ],
      },
    ],

    createdBy: {
      account_id: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  },
  { timestamps: true },
);

// Indexing for performance
productSchema.index({ deleted: 1, status: 1, position: 1 });
productSchema.index({ brand_id: 1 });
productSchema.index({ category_id: 1 });

productSchema.index({ title: "text", description: "text", shortDescription: "text" });

const Product = mongoose.model("Product", productSchema, "products");

module.exports = Product;
