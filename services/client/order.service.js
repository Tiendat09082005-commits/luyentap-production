const Order = require("../../models/order.model");
const orderHelper = require("../../helpers/order.helper");
const paymentService = require("../../services/payment.service");

class OrderService {
  /**
   * Get order detail with authorization check
   * @param {string} orderId 
   * @param {string} userId 
   */
  async getOrderDetail(orderId, userId) {
    const order = await Order.findOne({
      _id: orderId,
      user_id: userId,
      deleted: false
    })
    .select("-deleted -__v")
    .lean();

    if (!order) {
      throw new Error("Không tìm thấy đơn hàng hoặc bạn không có quyền truy cập");
    }

    // Format status using helper
    const { statusClass, statusText } = orderHelper.formatOrderStatus(order.status);
    
    return {
      ...order,
      statusClass,
      statusText,
      paymentMethodText: paymentService.getPaymentMethodLabel(order),
      paymentStatusText: paymentService.getPaymentStatusLabel(order.paymentStatus)
    };
  }
}


module.exports = new OrderService();
