const Order = require("../../models/order.model");

const countOrders = async (query) => {
  return await Order.countDocuments(query);
};

const findOrders = async (query, skip, limit) => {
  return await Order.find(query)
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 })
    .lean();
};

const findOrderById = async (id, lean = false) => {
  const query = Order.findById(id);
  if (lean) {
    query.lean();
  }
  return await query;
};

const findOneOrder = async (query, lean = false) => {
  const dbQuery = Order.findOne(query);
  if (lean) {
    dbQuery.lean();
  }
  return await dbQuery;
};

const updateOrder = async (id, data) => {
  return await Order.updateOne({ _id: id }, { $set: data });
};

const softDeleteOrder = async (id) => {
  return await Order.updateOne(
    { _id: id, deleted: false },
    { deleted: true, deletedAt: new Date() }
  );
};

module.exports = {
  countOrders,
  findOrders,
  findOrderById,
  findOneOrder,
  updateOrder,
  softDeleteOrder,
};
