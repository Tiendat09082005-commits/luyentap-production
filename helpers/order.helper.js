/**
 * Helper functions for Order formatting
 */

/**
 * Format order status for UI display
 * @param {string} status - Raw status from database
 * @returns {object} - { statusClass, statusText }
 */
module.exports.formatOrderStatus = (status) => {
  if (!status) return { statusClass: "status-unknown", statusText: "Không xác định" };

  const statusSlug = status
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-");

  return {
    statusClass: `status-${statusSlug}`,
    statusText: status.charAt(0).toUpperCase() + status.slice(1)
  };
};

module.exports.buildQuery = ({ keyword, status, date, userId }) => {
  const find = { deleted: false };

  if (userId) {
    const mongoose = require("mongoose");
    if (mongoose.Types.ObjectId.isValid(userId)) {
      find.user_id = userId;
    }
  }

  if (keyword) {
    const safeKeyword = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(safeKeyword, "i");

    find.$or = [
      { orderCode: regex },
      { "userInfo.fullName": regex },
      { "userInfo.phone": regex },
    ];
  }

  const VALID_STATUS = [
    "chờ xác nhận",
    "đã xác nhận",
    "đang giao",
    "đã giao",
    "đã hủy",
  ];

  if (status && VALID_STATUS.includes(status)) {
    find.status = status;
  }

  if (date) {
    const parsed = new Date(date);
    if (!isNaN(parsed)) {
      const start = new Date(parsed);
      start.setHours(0, 0, 0, 0);

      const end = new Date(parsed);
      end.setHours(23, 59, 59, 999);

      find.createdAt = { $gte: start, $lte: end };
    }
  }

  return find;
};
