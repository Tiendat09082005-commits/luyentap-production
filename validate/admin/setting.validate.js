function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (error) {
    return false;
  }
}

function isValidRelativeOrAbsoluteUrl(value) {
  if (!value) return true;
  if (value.startsWith("/")) return true;
  return isValidUrl(value);
}

function validateMaxLength(value, max, message, errors) {
  if (value && value.length > max) {
    errors.push(message);
  }
}

const SOCIAL_FIELDS = [
  "socialFacebook",
  "socialInstagram",
  "socialZalo",
  "socialTikTok",
  "socialYouTube",
];

const validateUpdateSettings = (body) => {
  const errors = [];

  const siteName = (body.siteName || "").trim();
  if (!siteName) {
    errors.push("Ten trang web la bat buoc");
  }

  validateMaxLength(siteName, 120, "Ten trang web qua dai", errors);
  validateMaxLength((body.siteSlogan || "").trim(), 160, "Khau hieu qua dai", errors);

  const metaDescription = (body.metaDescription || "").trim();
  validateMaxLength(metaDescription, 160, "Mo ta SEO toi da 160 ky tu", errors);

  const phone = (body.phone || "").trim();
  if (phone) {
    const normalizedPhone = phone.replace(/[\s.()-]/g, "");
    if (!/^\+?\d{10,15}$/.test(normalizedPhone)) {
      errors.push("So dien thoai khong hop le");
    }
  }

  const email = (body.email || "").trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Email khong hop le");
  }

  const marqueeSpeed = Number(body.marqueeSpeed);
  if (!Number.isFinite(marqueeSpeed) || marqueeSpeed < 20 || marqueeSpeed > 120) {
    errors.push("Toc do marquee phai trong khoang 20 den 120");
  }

  const heroCtaLink = (body.heroCtaLink || "").trim();
  if (heroCtaLink && !isValidRelativeOrAbsoluteUrl(heroCtaLink)) {
    errors.push("Link CTA khong hop le");
  }

  const googleMapEmbed = (body.googleMapEmbed || "").trim();
  if (googleMapEmbed && !googleMapEmbed.includes("<iframe")) {
    errors.push("Google Maps phai la ma iframe hop le");
  }

  for (const field of SOCIAL_FIELDS) {
    const value = (body[field] || "").trim();
    if (value && !isValidUrl(value)) {
      errors.push("Lien ket mang xa hoi khong hop le");
      break;
    }
  }

  return errors;
};

module.exports = {
  validateUpdateSettings,
};
