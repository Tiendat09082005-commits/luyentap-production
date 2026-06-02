const Cart = require("../../models/cart.model");
const findByUserId = async (userId) => {
  if (!userId) return null;
  return await Cart.findOne({ user_id: userId });
};
const findById = async (cartId) => {
  if (!cartId) return null;
  return await Cart.findById(cartId);
};
module.exports = { findByUserId, findById };
