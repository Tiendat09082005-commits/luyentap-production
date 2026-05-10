const Order = require("../../models/order.model");
const vnpay = require("../../helpers/vnpay");
const paymentService = require("../../services/payment.service");


// [GET] /payment/vnpay-ipn
module.exports.vnpayIPN = async (req, res) => {
  try {
    const verify = vnpay.verifyIpnCall(req.query);
    if (!verify.isVerified) {
      return res.status(400).json({ RspCode: "97", Message: "Invalid signature" });
    }

    const orderCode = verify.vnp_TxnRef;
    const order = await Order.findOne({ orderCode, deleted: false });
    if (!order) {
      return res.status(404).json({ RspCode: "01", Message: "Order not found" });
    }

    if (order.paymentStatus === "paid") {
      return res.json({ RspCode: "00", Message: "Already confirmed" });
    }

    const result = await paymentService.applyWebhookResult({
      orderCode,
      payload: verify,
      source: "ipn"
    });

    if (!result.ok) {
      if (result.code === "INVALID_AMOUNT") {
        return res.json({ RspCode: "04", Message: "Invalid amount" });
      }
      if (result.code === "ORDER_NOT_FOUND") {
        return res.status(404).json({ RspCode: "01", Message: "Order not found" });
      }
      return res.json({ RspCode: "99", Message: result.code || "Unhandled payment state" });
    }

    if (result.stateChanged && result.order?.paymentStatus === "paid") {
      const io = req.app.get("io");
      if (io) {
        io.emit("new_order", {
          customerName: result.order.userInfo?.fullName,
          productTitle: result.order.products?.[0]?.title,
          productImage: result.order.products?.[0]?.thumbnail
        });
      }
    }

    return res.json({ RspCode: "00", Message: "Success" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ RspCode: "99", Message: "Unknown error" });
  }
};

// [GET] /payment/vnpay-return
module.exports.vnpayReturn = async (req, res) => {
  try {
    const verify = vnpay.verifyReturnUrl(req.query);
    if (!verify.isVerified) {
      return res.redirect("/checkout/fail?code=INVALID_SIGNATURE&message=Phản hồi thanh toán không hợp lệ.");
    }

    const order = await paymentService.storeReturnObservation(verify.vnp_TxnRef, verify);
    if (!order) {
      return res.redirect("/checkout/fail?code=ORDER_NOT_FOUND&message=Không tìm thấy đơn hàng.");
    }

    if (order.paymentStatus === "paid") {
      return res.redirect("/checkout/success?orderId=" + order._id);
    }

    if (order.paymentStatus === "failed" || order.paymentStatus === "expired") {
      return res.redirect("/checkout/fail?orderId=" + order._id);
    }

    return res.redirect("/checkout/pending?orderId=" + order._id);
  } catch (error) {
    console.error("LEGACY VNPAY RETURN ERROR:", error);
    return res.redirect("/checkout/fail?code=RETURN_ERROR&message=Không thể xác minh trạng thái thanh toán.");
  }
};
