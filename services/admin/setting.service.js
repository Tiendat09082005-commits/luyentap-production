const Setting = require("../../models/setting.model");
const qs = require("qs");

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
  heroImages: [],
  heroSlides: [],
  heroTransitionDuration: 5,
  flashSaleEnabled: false,
  flashSaleStartTime: null,
  flashSaleEndTime: null,
  flashSaleProductIds: [],
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
  const res = {
    ...DEFAULT_SETTINGS,
    ...(setting || {}),
  };

  if (res.flashSaleStartTime) {
    const d = new Date(res.flashSaleStartTime);
    const tzOffset = d.getTimezoneOffset() * 60000;
    res.flashSaleStartTimeFormatted = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
  } else {
    res.flashSaleStartTimeFormatted = "";
  }

  if (res.flashSaleEndTime) {
    const d = new Date(res.flashSaleEndTime);
    const tzOffset = d.getTimezoneOffset() * 60000;
    res.flashSaleEndTimeFormatted = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
  } else {
    res.flashSaleEndTimeFormatted = "";
  }

  // Ensure heroImages has at least the single image if it exists for compatibility
  if ((!res.heroImages || res.heroImages.length === 0) && res.heroImageUrl) {
    res.heroImages = [res.heroImageUrl];
  }

  // Ensure heroSlides has at least the default compatibility slide if it is empty
  if (!res.heroSlides || res.heroSlides.length === 0) {
    const images = (res.heroImages && res.heroImages.length > 0)
      ? res.heroImages
      : (res.heroImageUrl ? [res.heroImageUrl] : []);

    if (images.length > 0) {
      res.heroSlides = images.map((img, idx) => ({
        imageUrl: img,
        heading: idx === 0 ? res.heroHeading : "",
        subheading: idx === 0 ? res.heroSubheading : "",
        label: "Khuyến mãi đặc biệt",
        discount: idx === 0 ? "Giảm đến 20%" : "",
        ctaText: idx === 0 ? res.heroCtaText : "Mua ngay",
        ctaLink: idx === 0 ? res.heroCtaLink : "/products"
      }));
    } else {
      res.heroSlides = [{
        imageUrl: "/assets/images/iphone15-banner.png",
        heading: res.heroHeading || "iPhone 15 Series",
        subheading: res.heroSubheading || "Trải nghiệm công nghệ đỉnh cao với camera 48MP và chip A17 Pro mạnh mẽ nhất.",
        label: "Khuyến mãi đặc biệt",
        discount: "Giảm đến 20%",
        ctaText: res.heroCtaText || "Mua ngay",
        ctaLink: res.heroCtaLink || "/products"
      }];
    }
  }

  return res;
}

async function updateSettings(payload) {
  const currentSettings = await getSettings();

  // Parse nested heroSlides from payload using qs
  const parsed = qs.parse(qs.stringify(payload));
  let heroSlides = [];
  if (Array.isArray(parsed.heroSlides)) {
    heroSlides = parsed.heroSlides.map((slide, idx) => {
      if (!slide) return null;
      let imageUrl = slide.imageUrl || "";
      if (payload.heroSlidesUploadedImages && payload.heroSlidesUploadedImages[idx]) {
        imageUrl = payload.heroSlidesUploadedImages[idx];
      }
      return {
        imageUrl: normalizeText(imageUrl),
        heading: normalizeText(slide.heading),
        subheading: normalizeText(slide.subheading),
        label: normalizeText(slide.label || "Khuyến mãi đặc biệt"),
        discount: normalizeText(slide.discount),
        ctaText: normalizeText(slide.ctaText || "Mua ngay"),
        ctaLink: normalizeText(slide.ctaLink || "/products")
      };
    }).filter(Boolean);
  } else if (parsed.heroSlides) {
    // If it's an object instead of array
    heroSlides = Object.keys(parsed.heroSlides).map((key) => {
      const slide = parsed.heroSlides[key];
      const idx = parseInt(key);
      if (!slide) return null;
      let imageUrl = slide.imageUrl || "";
      if (payload.heroSlidesUploadedImages && payload.heroSlidesUploadedImages[idx]) {
        imageUrl = payload.heroSlidesUploadedImages[idx];
      }
      return {
        imageUrl: normalizeText(imageUrl),
        heading: normalizeText(slide.heading),
        subheading: normalizeText(slide.subheading),
        label: normalizeText(slide.label || "Khuyến mãi đặc biệt"),
        discount: normalizeText(slide.discount),
        ctaText: normalizeText(slide.ctaText || "Mua ngay"),
        ctaLink: normalizeText(slide.ctaLink || "/products")
      };
    }).filter(Boolean);
  }

  const nextSettings = {
    singletonKey: "site",
    siteName: normalizeText(payload.siteName),
    siteSlogan: normalizeText(payload.siteSlogan),
    metaDescription: normalizeText(payload.metaDescription),
    faviconUrl: currentSettings.faviconUrl,
    logoUrl: currentSettings.logoUrl,
    marqueeText: normalizeText(payload.marqueeText),
    marqueeSpeed: normalizeNumber(payload.marqueeSpeed, currentSettings.marqueeSpeed || 60),
    marqueeEnabled: normalizeBoolean(payload.marqueeEnabled),
    heroHeading: normalizeText(payload.heroHeading),
    heroSubheading: normalizeText(payload.heroSubheading),
    heroCtaText: normalizeText(payload.heroCtaText),
    heroCtaLink: normalizeText(payload.heroCtaLink),
    heroSlides: heroSlides,
    heroImageUrl: heroSlides.length > 0 ? heroSlides[0].imageUrl : "",
    heroImages: heroSlides.map(s => s.imageUrl),
    heroTransitionDuration: normalizeNumber(payload.heroTransitionDuration, currentSettings.heroTransitionDuration || 5),
    flashSaleEnabled: normalizeBoolean(payload.flashSaleEnabled),
    flashSaleStartTime: payload.flashSaleStartTime ? new Date(payload.flashSaleStartTime) : null,
    flashSaleEndTime: payload.flashSaleEndTime ? new Date(payload.flashSaleEndTime) : null,
    flashSaleProductIds: Array.isArray(payload.flashSaleProductIds)
      ? payload.flashSaleProductIds
      : (payload.flashSaleProductIds ? [payload.flashSaleProductIds] : []),
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
