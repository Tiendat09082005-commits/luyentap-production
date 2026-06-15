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

  const heroTransitionDuration = Number(body.heroTransitionDuration);
  if (body.heroTransitionDuration && (isNaN(heroTransitionDuration) || heroTransitionDuration < 1 || heroTransitionDuration > 60)) {
    errors.push("Thoi gian chuyen anh phai tu 1 den 60 giay");
  }

  const flashSaleEnabled = body.flashSaleEnabled === "on" || body.flashSaleEnabled === "true" || body.flashSaleEnabled === true;
  if (flashSaleEnabled) {
    if (!body.flashSaleStartTime) {
      errors.push("Thoi gian bat dau Flash Sale la bat buoc");
    }
    if (!body.flashSaleEndTime) {
      errors.push("Thoi gian ket thuc Flash Sale la bat buoc");
    }
    if (body.flashSaleStartTime && body.flashSaleEndTime) {
      const start = new Date(body.flashSaleStartTime);
      const end = new Date(body.flashSaleEndTime);
      if (isNaN(start.getTime())) {
        errors.push("Thoi gian bat dau khong hop le");
      }
      if (isNaN(end.getTime())) {
        errors.push("Thoi gian ket thuc khong hop le");
      }
      if (!isNaN(start.getTime()) && !isNaN(end.getTime()) && end <= start) {
        errors.push("Thoi gian ket thuc phai lon hon thoi gian bat dau");
      }
    }
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
