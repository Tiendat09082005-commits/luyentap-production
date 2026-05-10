const ProductVariant = require("../../models/productVariant.model");

const VALID_STATUSES = ["active", "inactive"];
const VALID_MULTI_TYPES = ["active", "inactive", "change-position", "delete-all"];

/**
 * Kiểm tra SKU trùng trong cùng một request (chưa vào DB)
 * @returns {{ valid: boolean, message?: string }}
 */
function validateSkuUniquenessInRequest(variantData = []) {
  const skuSet = new Set();
  for (const variant of variantData) {
    const sku = variant.sku ? variant.sku.trim() : "";
    if (sku === "") continue;
    if (skuSet.has(sku)) {
      return { valid: false, message: `SKU bị trùng trong request: ${sku}` };
    }
    skuSet.add(sku);
  }
  return { valid: true };
}

/**
 * Kiểm tra SKU đã tồn tại trong DB
 * @param {string[]} skuList - Danh sách SKU cần kiểm tra
 * @param {object} options - { excludeProductId?, session? }
 * @returns {{ valid: boolean, message?: string }}
 */
async function validateSkuUniquenessInDB(skuList = [], { excludeProductId, session } = {}) {
  if (skuList.length === 0) return { valid: true };

  const query = { sku: { $in: skuList }, deleted: false };
  if (excludeProductId) {
    query.product_id = { $ne: excludeProductId };
  }

  const duplicated = await ProductVariant.findOne(query).session(session || null);
  if (duplicated) {
    return { valid: false, message: `SKU đã tồn tại trong hệ thống: ${duplicated.sku}` };
  }
  return { valid: true };
}


function extractSkuList(variantData = []) {
  return variantData
    .map((v) => (v.sku ? v.sku.trim() : ""))
    .filter((s) => s !== "");
}


function validateStatus(status) {
  if (!VALID_STATUSES.includes(status)) {
    return { valid: false, message: `Trạng thái không hợp lệ: ${status}` };
  }
  return { valid: true };
}

function validateChangeMultiInput(body = {}) {
  const { type, ids } = body;

  if (!type || !VALID_MULTI_TYPES.includes(type)) {
    return { valid: false, message: `Loại thao tác không hợp lệ: ${type}` };
  }

  if (!ids || typeof ids !== "string" || ids.trim() === "") {
    return { valid: false, message: "Danh sách ID không hợp lệ" };
  }

  return { valid: true };
}

module.exports = {
  validateSkuUniquenessInRequest,
  validateSkuUniquenessInDB,
  extractSkuList,
  validateStatus,
  validateChangeMultiInput,
};