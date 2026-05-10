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

module.exports = {
  DEFAULT_SETTINGS,
  getSettings,
  updateSettings,
};
