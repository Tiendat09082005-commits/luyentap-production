const Product = require("../../models/products.model");
const findActiveProductById = async (productId) => {
  if (!productId) return null;
  return await Product.findOne({ _id: productId, deleted: false }).lean();
};
module.exports = { findActiveProductById };
