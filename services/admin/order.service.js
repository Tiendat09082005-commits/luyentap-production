const orderRepo = require("../../repositories/admin/order.reponsitory");
const productRepo = require("../../repositories/admin/product.reponsitory");
const { SearchHelper } = require("../../helpers/searchHelper");
const searchConfigs = require("../../config/search.config");
const { priceNew } = require("../../helpers/priceNew");
const { buildQuery } = require("../../helpers/order.helper");
const AppError = require("../../utils/AppError");
const ERROR_CODE = require("../../constants/error-code");

const VALID_STATUS = [
  "chờ xác nhận",
  "đã xác nhận",
  "đang giao",
  "đã giao",
  "đã hủy",
];

//  get orders
const getOrders = async (query, pagination) => {
  const find = buildQuery(query);

  const total = await orderRepo.countOrders(find);

  const orders = await orderRepo.findOrders(find, pagination.skip, pagination.limit);

  // 🔥 batch product fetch
  const allProductIds = [
    ...new Set(
      orders.flatMap((o) => o.products.map((p) => p.product_id?.toString())),
    ),
  ];

  const products = await productRepo.findProductsByIds(allProductIds, "title");

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

  if (!VALID_STATUS.includes(trimmedStatus)) {
    throw new AppError(400, ERROR_CODE.ORDER_INVALID_STATUS, `Trạng thái "${trimmedStatus}" không hợp lệ`);
  }

  const mongoose = require("mongoose");
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError(400, ERROR_CODE.ORDER_INVALID_ID, "ID đơn hàng không hợp lệ");
  }

  const order = await orderRepo.findOrderById(orderId);
  if (!order) {
    throw new AppError(404, ERROR_CODE.ORDER_NOT_FOUND, "Không tìm thấy đơn hàng trong hệ thống");
  }

  // State Machine Logic
  const currentStatus = order.status;
  
  if (currentStatus === "đã giao" || currentStatus === "đã hủy") {
    throw new AppError(400, ERROR_CODE.ORDER_INVALID_TRANSITION, "Không thể cập nhật đơn hàng đã ở trạng thái hoàn tất");
  }

  // Validate forward transition
  const validTransitions = {
    "chờ xác nhận": ["đã xác nhận", "đang giao", "đã hủy"],
    "đã xác nhận": ["đang giao", "đã hủy"],
    "đang giao": ["đã giao", "đã hủy"]
  };

  if (!validTransitions[currentStatus]?.includes(trimmedStatus)) {
    throw new AppError(400, ERROR_CODE.ORDER_INVALID_TRANSITION, `Không thể chuyển trạng thái từ "${currentStatus}" sang "${trimmedStatus}"`);
  }

  await orderRepo.updateOrder(orderId, { status: trimmedStatus });
  return true;
};

const deleteOrder = async (id) => {
    const result = await orderRepo.softDeleteOrder(id);

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
  const mongoose = require("mongoose");
  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    throw new AppError(400, ERROR_CODE.ORDER_INVALID_ID, "ID đơn hàng không hợp lệ");
  }

  const order = await orderRepo.findOneOrder({ _id: orderId, deleted: false }, true);

  if (!order) {
    throw new AppError(404, ERROR_CODE.ORDER_NOT_FOUND, "Không tìm thấy đơn hàng trong hệ thống");
  }

  const productIds = order.products
    .map(p => p.product_id)
    .filter(Boolean);

  let productMap = {};

  if (productIds.length > 0) {
    const productsInfo = await productRepo.findProductsByIds(productIds, "title price discount");

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
