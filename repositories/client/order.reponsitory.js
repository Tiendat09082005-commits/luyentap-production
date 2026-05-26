const Order = require("../../models/order.model");

const findByUserIdActive = async (userId) => {
  return Order.find({ user_id: userId, deleted: false }).sort({ createdAt: -1 }).lean();
};

module.exports = {
  findByUserIdActive,
};
