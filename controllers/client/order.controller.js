const orderService = require("../../services/client/order.service");

// [GET] /orders/:id
module.exports.detail = async (req, res) => {
  const orderId = req.params.id;
  const userId = req.user._id;

  try {
    const order = await orderService.getOrderDetail(orderId, userId);

    res.render("client/pages/order/detail", {
      pageTitle: "Chi tiết đơn hàng",
      order: order
    });
  } catch (error) {
    console.error(`[OrderController] Error fetching order ${orderId} for user ${userId}:`, error.message);
    
    req.flash("error", error.message || "Đã có lỗi xảy ra khi lấy chi tiết đơn hàng.");
    res.redirect(`/user/detail/${userId}`);
  }
};
