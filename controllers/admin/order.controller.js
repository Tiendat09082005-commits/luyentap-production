const Order = require("../../models/order.model");
const Product = require("../../models/products.model");
const { priceNew } = require("../../helpers/priceNew");
const paginationHelper = require("../../helpers/pagination");
const { SearchHelper } = require("../../helpers/searchHelper");
const cacheService = require("../../services/cache.service");
const searchConfigs = require("../../config/search.config");
const orderService = require("../../services/admin/order.service");

const invalidateOrderSearchCache = async () => {
  await cacheService.invalidateSearchModel("Order");
};

//[GET] /admin/order
module.exports.index = async (req, res) => {
  try {
    const { keyword, status, date, userId } = req.query;

    const pagination = paginationHelper(req.query, 0);

    const { orders, total } = await orderService.getOrders(
      { keyword, status, date, userId },
      pagination,
    );

    pagination.totalItems = total;

    let customerName = "";
    if (userId) {
      const User = require("../../models/user.model");
      const user = await User.findById(userId).select("fullName").lean();
      if (user) {
        customerName = user.fullName;
      }
    }

    res.render("admin/pages/order/index", {
      orders,
      pagination,
      userId,
      customerName,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

// [POST] /admin/order/update-status
module.exports.updateStatus = async (req, res) => {
  try {
    const { orderId, status } = req.body;

    if (!orderId || !status) {
      return res.status(400).json({
        success: false,
        message: "Thiếu orderId hoặc status",
      });
    }

    await orderService.updateOrderStatus(orderId, status);

    await invalidateOrderSearchCache();

    return res.json({
      success: true,
      message: "Cập nhật trạng thái thành công",
    });
  } catch (error) {
    console.error("Update status error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Update status failed",
    });
  }
};

//[POST] /admin/order/delete-order
module.exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.body;

    await orderService.deleteOrder(id);

    await invalidateOrderSearchCache();

    return res.json({
      success: true,
      message: "Xoá đơn hàng thành công",
    });
  } catch (error) {
    console.error("DELETE ORDER ERROR:", error);

    if (error.message === "ORDER_NOT_FOUND") {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Delete item failed",
    });
  }
};

module.exports.Suggest = async (req, res) => {
  try {
    const { keyword } = req.validated;

    const orders = await orderService.suggestOrders(keyword);

    return res.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("Suggest error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports.detail = async (req, res) => {
  try {
    const { orderId } = req.validated;

    const order = await orderService.getOrderDetail(orderId);

    if (!order) {
      req.flash("error", "Không tìm thấy đơn hàng");
      return res.redirect("back");
    }

    return res.render("admin/pages/order/detail", { order });

  } catch (error) {
    console.error("ORDER DETAIL ERROR:", error);
    return res.redirect("back");
  }
};