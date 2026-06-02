const ProductVariant = require("../../models/productVariant.model");
const findActiveVariantById = async (variantId) => {
  if (!variantId) return null;
  return await ProductVariant.findOne({ _id: variantId, deleted: false }).lean();
};
module.exports = { findActiveVariantById };
