const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    singletonKey: {
      type: String,
      required: true,
      unique: true,
      default: "site",
      trim: true,
    },
    siteName: { type: String, trim: true, default: "" },
    siteSlogan: { type: String, trim: true, default: "" },
    metaDescription: { type: String, trim: true, default: "", maxlength: 160 },
    faviconUrl: { type: String, trim: true, default: "" },
    logoUrl: { type: String, trim: true, default: "" },
    marqueeText: { type: String, trim: true, default: "" },
    marqueeSpeed: { type: Number, default: 60, min: 20, max: 120 },
    marqueeEnabled: { type: Boolean, default: false },
    heroHeading: { type: String, trim: true, default: "" },
    heroSubheading: { type: String, trim: true, default: "" },
    heroCtaText: { type: String, trim: true, default: "" },
    heroCtaLink: { type: String, trim: true, default: "" },
    heroImageUrl: { type: String, trim: true, default: "" },
    heroImages: { type: [String], default: [] },
    heroSlides: {
      type: [{
        imageUrl: { type: String, default: "" },
        heading: { type: String, default: "" },
        subheading: { type: String, default: "" },
        label: { type: String, default: "Khuyến mãi đặc biệt" },
        discount: { type: String, default: "" },
        ctaText: { type: String, default: "Mua ngay" },
        ctaLink: { type: String, default: "/products" }
      }],
      default: []
    },
    heroTransitionDuration: { type: Number, default: 5 },
    flashSaleEnabled: { type: Boolean, default: false },
    flashSaleStartTime: { type: Date },
    flashSaleEndTime: { type: Date },
    flashSaleProductIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    address: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, default: "" },
    googleMapEmbed: { type: String, trim: true, default: "" },
    workingHours: { type: String, trim: true, default: "" },
    socialFacebook: { type: String, trim: true, default: "" },
    socialInstagram: { type: String, trim: true, default: "" },
    socialZalo: { type: String, trim: true, default: "" },
    socialTikTok: { type: String, trim: true, default: "" },
    socialYouTube: { type: String, trim: true, default: "" },
    onlinePaymentTimeoutMinutes: { type: Number, default: 15, min: 1, max: 180 },
  },
  {
    timestamps: true,
  }
);

const Setting = mongoose.model("Setting", settingSchema, "settings");

module.exports = Setting;
