const Setting = require("../../models/setting.model");

const DEFAULT_SETTINGS = {
  siteName: "",
  siteSlogan: "",
  metaDescription: "",
  faviconUrl: "",
  logoUrl: "",
  marqueeText: "",
  marqueeSpeed: 60,
  marqueeEnabled: false,
  heroHeading: "",
  heroSubheading: "",
  heroCtaText: "",
  heroCtaLink: "",
  heroImageUrl: "",
  address: "",
  phone: "",
  email: "",
  googleMapEmbed: "",
  workingHours: "",
  socialFacebook: "",
  socialInstagram: "",
  socialZalo: "",
  socialTikTok: "",
  socialYouTube: "",
  onlinePaymentTimeoutMinutes: 15,
};

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeBoolean(value) {
  return value === true || value === "true" || value === "on" || value === "1";
}

function normalizeNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function getSettings() {
  const setting = await Setting.findOne({ singletonKey: "site" }).lean();

  return {
    ...DEFAULT_SETTINGS,
    ...(setting || {}),
  };
}

async function updateSettings(payload) {
  const currentSettings = await getSettings();

  const nextSettings = {
    singletonKey: "site",
    siteName: normalizeText(payload.siteName),
    siteSlogan: normalizeText(payload.siteSlogan),
    metaDescription: normalizeText(payload.metaDescription),
    faviconUrl: normalizeText(payload.favicon) || currentSettings.faviconUrl,
    logoUrl: normalizeText(payload.logo) || currentSettings.logoUrl,
    marqueeText: normalizeText(payload.marqueeText),
    marqueeSpeed: normalizeNumber(payload.marqueeSpeed, currentSettings.marqueeSpeed || 60),
    marqueeEnabled: normalizeBoolean(payload.marqueeEnabled),
    heroHeading: normalizeText(payload.heroHeading),
    heroSubheading: normalizeText(payload.heroSubheading),
    heroCtaText: normalizeText(payload.heroCtaText),
    heroCtaLink: normalizeText(payload.heroCtaLink),
    heroImageUrl: normalizeBoolean(payload.removeHeroImage)
      ? ""
      : normalizeText(payload.heroImage) || currentSettings.heroImageUrl,
    address: normalizeText(payload.address),
    phone: normalizeText(payload.phone),
    email: normalizeText(payload.email),
    googleMapEmbed: normalizeText(payload.googleMapEmbed),
    workingHours: normalizeText(payload.workingHours),
    socialFacebook: normalizeText(payload.socialFacebook),
    socialInstagram: normalizeText(payload.socialInstagram),
    socialZalo: normalizeText(payload.socialZalo),
    socialTikTok: normalizeText(payload.socialTikTok),
    socialYouTube: normalizeText(payload.socialYouTube),
    onlinePaymentTimeoutMinutes: normalizeNumber(
      payload.onlinePaymentTimeoutMinutes,
      currentSettings.onlinePaymentTimeoutMinutes || 15
    ),
  };

  const updated = await Setting.findOneAndUpdate(
    { singletonKey: "site" },
    nextSettings,
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  ).lean();

  return {
    ...DEFAULT_SETTINGS,
    ...(updated || nextSettings),
  };
}

const SEED_DEFAULTS = {
  singletonKey: "site",
  siteName: "Tida",
  siteSlogan: "Hệ thống mua sắm hiện đại và chuyên nghiệp",
  metaDescription:
    "Tida - Mua sắm trực tuyến với giá tốt nhất. Miễn phí vận chuyển toàn quốc.",
  faviconUrl: "",
  logoUrl: "",
  marqueeText:
    "Miễn phí vận chuyển cho đơn hàng từ 500.000đ | Giảm thêm 5% khi thanh toán online | Bảo hành chính hãng 12-24 tháng",
  marqueeSpeed: 60,
  marqueeEnabled: true,
  heroHeading: "iPhone 15 Series",
  heroSubheading:
    "Trải nghiệm công nghệ đỉnh cao với camera 48MP và chip A17 Pro mạnh mẽ nhất.",
  heroCtaText: "Mua ngay",
  heroCtaLink: "/products",
  heroImageUrl: "",
  address: "Hà Nội, Việt Nam",
  phone: "0969175166",
  email: "tiendatnguyendanh@gmail.com",
  googleMapEmbed: "",
  workingHours: "T2 - T6: 8:00 - 17:00",
  socialFacebook: "https://web.facebook.com/atnguyen.656678",
  socialInstagram: "",
  socialZalo: "",
  socialTikTok: "",
  socialYouTube: "",
  onlinePaymentTimeoutMinutes: 15,
};

async function ensureDefaultSettings() {
  const existing = await Setting.findOne({ singletonKey: "site" }).lean();
  if (existing) {
    console.log("[Settings] Document already exists — skipping seed.");
    return existing;
  }

  const created = await Setting.create(SEED_DEFAULTS);
  console.log("[Settings] Seeded default settings into database.");
  return created;
}

module.exports = {
  DEFAULT_SETTINGS,
  SEED_DEFAULTS,
  getSettings,
  updateSettings,
  ensureDefaultSettings,
};
