const Order = require("../../models/order.model");
const Product = require("../../models/products.model");
const { SearchHelper } = require("../../helpers/searchHelper");
const searchConfigs = require("../../config/search.config");
const { priceNew } = require("../../helpers/priceNew");

const VALID_STATUS = [
  "chờ xác nhận",
  "đã xác nhận",
  "đang giao",
  "đã giao",
  "đã hủy",
];

//  build query sạch
const buildQuery = ({ keyword, status, date }) => {
  const find = { deleted: false };

  if (keyword) {
    const safeKeyword = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(safeKeyword, "i");

    find.$or = [
      { orderCode: regex },
      { "userInfo.fullName": regex },
      { "userInfo.phone": regex },
    ];
  }

  if (status && VALID_STATUS.includes(status)) {
    find.status = status;
  }

  if (date) {
    const parsed = new Date(date);
    if (!isNaN(parsed)) {
      const start = new Date(parsed);
      start.setHours(0, 0, 0, 0);

      const end = new Date(parsed);
      end.setHours(23, 59, 59, 999);

      find.createdAt = { $gte: start, $lte: end };
    }
  }

  return find;
};

//  get orders
const getOrders = async (query, pagination) => {
  const find = buildQuery(query);

  const total = await Order.countDocuments(find);

  const orders = await Order.find(find)
    .skip(pagination.skip)
    .limit(pagination.limit)
    .sort({ createdAt: -1 })
    .lean();

  // 🔥 batch product fetch
  const allProductIds = [
    ...new Set(
      orders.flatMap((o) => o.products.map((p) => p.product_id?.toString())),
    ),
  ];

  const products = await Product.find({ _id: { $in: allProductIds } })
    .select("title")
    .lean();

  const productMap = Object.fromEntries(
    products.map((p) => [p._id.toString(), p.title]),
  );

  //  enrich data
  orders.forEach((order) => {
    order.products.forEach((item) => {
      item.titleResolved =
        productMap[item.product_id?.toString()] || item.title || "N/A";
    });
  });

  return { orders, total };
};

//  update status có validate
const updateOrderStatus = async (orderId, status) => {
  const trimmedStatus = status ? status.trim() : "";
  console.log(`[OrderService] Updating Order ${orderId} to status: "${trimmedStatus}"`);

  if (!VALID_STATUS.includes(trimmedStatus)) {
    console.error(`[OrderService] Invalid status provided: "${trimmedStatus}". Valid:`, VALID_STATUS);
    throw new Error(`Trạng thái "${trimmedStatus}" không hợp lệ`);
  }

  const mongoose = require("mongoose");
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new Error("ID đơn hàng không hợp lệ");
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error("Không tìm thấy đơn hàng trong hệ thống");
  }

  console.log(`[OrderService] Current order status: "${order.status}"`);

  //  rule đơn giản (có thể nâng cấp thành state machine)
  if (order.status === "đã giao" || order.status === "đã hủy") {
    throw new Error("Không thể cập nhật đơn hàng đã ở trạng thái hoàn tất");
  }

  await Order.updateOne(
    { _id: orderId },
    { $set: { status: trimmedStatus } }
  );

  console.log(`[OrderService] Order ${orderId} updated successfully to "${trimmedStatus}"`);
  return true;
};

const deleteOrder = async (id) => {
    const result = await Order.updateOne(
        {
            _id: id,
            deleted: false
        },
        {
            deleted: true,
            deletedAt: new Date()
        }
    );

    if (result.matchedCount === 0) {
        throw new Error("ORDER_NOT_FOUND");
    }

    return true;
};



const suggestOrders = async (keyword) => {
  return SearchHelper.suggest({
    model: searchConfigs.orders.model,
    keyword,
    suggestFields: searchConfigs.orders.suggestFields,
    projection: searchConfigs.orders.suggestProjection,
    filter: searchConfigs.orders.defaultFilter,
    limit: 5,
    minKeywordLength: 2
  });
};

const getOrderDetail = async (orderId) => {
  const order = await Order.findOne({
    _id: orderId,
    deleted: false,
  }).lean();

  if (!order) {
    return null;
  }

  const productIds = order.products
    .map(p => p.product_id)
    .filter(Boolean);

  let productMap = {};

  if (productIds.length > 0) {
    const productsInfo = await Product.find({
      _id: { $in: productIds },
    })
      .select("title price discount")
      .lean();

    productMap = Object.fromEntries(
      productsInfo.map(p => [p._id.toString(), p])
    );
  }

  order.products = order.products.map(item => {
    const storedPrice = item.price ?? 0;
    const storedDiscount = item.discountPercentage ?? 0;

    const product = productMap[item.product_id?.toString()];

    return {
      ...item,
      title: product?.title || item.title,
      price: storedPrice,
      discount: storedDiscount,
      priceNew: priceNew(storedPrice, storedDiscount)
    };
  });

  return order;
};

module.exports = {
  getOrders,
  updateOrderStatus, VALID_STATUS,deleteOrder,suggestOrders , getOrderDetail
};
