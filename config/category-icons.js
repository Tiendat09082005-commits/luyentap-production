const DEFAULT_CATEGORY_ICON = "smartphone";

const CATEGORY_ICON_PRESETS = [
  { name: "smartphone", label: "Dien thoai" },
  { name: "laptop", label: "Laptop" },
  { name: "tablet", label: "Tablet" },
  { name: "watch", label: "Dong ho" },
  { name: "headphones", label: "Tai nghe" },
  { name: "speaker", label: "Loa" },
  { name: "camera", label: "Camera" },
  { name: "monitor", label: "Man hinh" },
  { name: "keyboard", label: "Ban phim" },
  { name: "mouse", label: "Chuot" },
  { name: "printer", label: "May in" },
  { name: "gamepad-2", label: "Gaming" },
];

const CATEGORY_ICON_ALIAS_MAP = {
  phone: "smartphone",
  accessory: "headphones",
  audio: "speaker",
  gamepad: "gamepad-2",
};

const isLucideIconName = (value) => /^[a-z0-9-]+$/.test(value);

const normalizeCategoryIcon = (value) => {
  if (typeof value !== "string") {
    return DEFAULT_CATEGORY_ICON;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return DEFAULT_CATEGORY_ICON;
  }

  const aliased = CATEGORY_ICON_ALIAS_MAP[normalized] || normalized;
  if (!isLucideIconName(aliased)) {
    return DEFAULT_CATEGORY_ICON;
  }

  return aliased;
};

module.exports = {
  DEFAULT_CATEGORY_ICON,
  CATEGORY_ICON_PRESETS,
  CATEGORY_ICON_ALIAS_MAP,
  isLucideIconName,
  normalizeCategoryIcon,
};
