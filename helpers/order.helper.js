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
