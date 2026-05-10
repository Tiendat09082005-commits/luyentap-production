const PERIODS = ["week", "month", "year"];

const clampNumber = (value, min, max, fallback) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
};

const validateDashboardQuery = (query = {}) => {
  const errors = [];
  const sanitized = {
    period: "month",
    recentLimit: 8,
    topLimit: 5
  };

  if (query.period !== undefined) {
    const normalizedPeriod = String(query.period).trim().toLowerCase();
    if (!PERIODS.includes(normalizedPeriod)) {
      errors.push("Khoảng thời gian dashboard không hợp lệ");
    } else {
      sanitized.period = normalizedPeriod;
    }
  }

  if (query.recentLimit !== undefined) {
    const parsed = parseInt(query.recentLimit, 10);
    if (Number.isNaN(parsed)) {
      errors.push("Giới hạn đơn gần đây không hợp lệ");
    } else {
      sanitized.recentLimit = clampNumber(parsed, 1, 20, 8);
    }
  }

  if (query.topLimit !== undefined) {
    const parsed = parseInt(query.topLimit, 10);
    if (Number.isNaN(parsed)) {
      errors.push("Giới hạn sản phẩm bán chạy không hợp lệ");
    } else {
      sanitized.topLimit = clampNumber(parsed, 1, 10, 5);
    }
  }

  return {
    errors,
    value: sanitized
  };
};

module.exports = {
  validateDashboardQuery
};
