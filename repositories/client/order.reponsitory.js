const Order = require("../../models/order.model");

const findByUserIdActive = async (userId) => {
  return Order.find({ user_id: userId, deleted: false }).sort({ createdAt: -1 }).lean();
};

const findByIdAndUserIdActive = async (orderId, userId) => {
  return Order.findOne({
    _id: orderId,
    user_id: userId,
    deleted: false
  })
  .select("-deleted -__v")
  .lean();
};

module.exports = {
  findByUserIdActive,
  findByIdAndUserIdActive,
};
