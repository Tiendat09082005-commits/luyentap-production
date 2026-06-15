const Product = require("../../models/products.model");
const findActiveProductById = async (productId) => {
  if (!productId) return null;
  return await Product.findOne({ _id: productId, deleted: false }).lean();
};
const findActiveProductsByIds = async (productIds) => {
  if (!productIds || productIds.length === 0) return [];
  return await Product.find({ _id: { $in: productIds }, deleted: false }).lean();
};
module.exports = { findActiveProductById, findActiveProductsByIds };
