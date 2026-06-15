const ProductVariant = require("../../models/productVariant.model");
const findActiveVariantById = async (variantId) => {
  if (!variantId) return null;
  return await ProductVariant.findOne({ _id: variantId, deleted: false }).lean();
};
const findActiveVariantsByIds = async (variantIds) => {
  if (!variantIds || variantIds.length === 0) return [];
  return await ProductVariant.find({ _id: { $in: variantIds }, deleted: false }).lean();
};
module.exports = { findActiveVariantById, findActiveVariantsByIds };
