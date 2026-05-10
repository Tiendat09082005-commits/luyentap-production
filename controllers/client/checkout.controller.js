const User = require("../../models/user.model");
const Product = require("../../models/products.model");
const ProductVariant = require("../../models/productVariant.model");
const Cart = require("../../models/cart.model");
const priceNewHelper = require("../../helpers/priceNew");
const Order = require("../../models/order.model");
const vnpay = require("../../helpers/vnpay");
const paymentService = require("../../services/payment.service");
const paymentController = require("./payment.controller");


// [POST] /checkout/buy-now
module.exports.buyNow = async (req, res) => {
  try {
    const { productId, variantId } = req.body;
    const quantity = parseInt(req.body.quantity) || 1;

    let cart;
    if (req.user) {
      cart = await Cart.findOne({ user_id: req.user._id });
      if (!cart) {
        cart = await Cart.create({ user_id: req.user._id, products: [] });
      }
    } else {
      const cartId = req.cookies.cartId;
      if (!cartId) {
        cart = await Cart.create({ user_id: null, products: [] });
        res.cookie("cartId", cart._id.toString());
      } else {
        cart = await Cart.findById(cartId);
      }
    }

    const index = cart.products.findIndex(
      (p) =>
        p.product_id.toString() === productId &&
        (variantId
          ? p.variant_id && p.variant_id.toString() === variantId
          : !p.variant_id),
    );

    if (index >= 0) {
      cart.products[index].quantity += quantity;
    } else {
      cart.products.push({
        product_id: productId,
        variant_id: variantId || null,
        quantity,
      });
    }

    await cart.save();
    res.redirect("/checkout/payment-info");
  } catch (error) {
    console.error(error);
    res.redirect("/products");
  }
};

// [GET] /checkout/payment-info
module.exports.paymentInfo = async (req, res) => {
  try {
    const id = req.user.id;
    const user = await User.findOne({
      _id: id,
      deleted: false,
    }).select("-password -tokenUser");

    const cart = await Cart.findOne({
      user_id: user._id,
    });

    if (!cart || !cart.products || cart.products.length === 0) {
      return res.redirect("/cart");
    }

    // Capture selected items from body (for selection feature)
    const selectedItemIds = Array.isArray(req.body.cartItemIds)
      ? req.body.cartItemIds
      : (req.body.cartItemIds ? [req.body.cartItemIds] : []);
    const isSelectionMode = selectedItemIds.length > 0;

    let products = [];
    let totalPrice = 0;

    for (let item of cart.products) {
      // If we're in selection mode, skip items not in the selected list
      if (isSelectionMode) {
        const itemKey =
          item.product_id.toString() +
          (item.variant_id ? `_${item.variant_id}` : "");
        if (!selectedItemIds.includes(itemKey)) continue;
      }
      const productInfo = await Product.findOne({
        _id: item.product_id,
        deleted: false,
      }).lean();

      if (productInfo) {
        let price = 0;
        let discount = 0;
        let variantInfo = null;

        if (item.variant_id) {
          variantInfo = await ProductVariant.findOne({
            _id: item.variant_id,
            deleted: false,
          }).lean();

          if (variantInfo) {
            price = variantInfo.price;
            discount = variantInfo.discount;
            productInfo.thumbnail =
              variantInfo.thumbnail || productInfo.thumbnail;
            productInfo.variantAttributes = variantInfo.attributes;
          }
        }

        // Fallback for price if no variant or variant not found
        if (!price && !discount) {
          price = productInfo.price || 0;
          discount = productInfo.discount || 0;
        }

        productInfo.price = price;
        productInfo.discount = discount;
        productInfo.priceNew = priceNewHelper.priceNew(price, discount);
        productInfo.quantity = item.quantity;
        productInfo.variant_id = item.variant_id; // QUAN TRỌNG: Gửi variant_id ra view
        productInfo.totalPrice = productInfo.priceNew * item.quantity;

        totalPrice += productInfo.totalPrice;
        products.push(productInfo);
      }
    }

    res.render("client/pages/checkout/payment-info.pug", {
      user: user,
      products: products,
      totalPrice: totalPrice,
    });
  } catch (error) {
    console.error(error);
    res.redirect("/cart");
  }
};

// [POST] /checkout/payment
module.exports.payment = async (req, res) => {
  try {
    const products = req.body.products || [];
    const totalPrice = parseInt(req.body.totalPrice) || 0;
    const userInfo = req.body.userInfo || {};
    const note = req.body.note || "";
    const checkoutToken = paymentService.createCheckoutToken();
    const idempotencyKey = paymentService.createCheckoutToken();
    const timeoutMinutes = await paymentService.getCheckoutTimeoutMinutes();
    const expiresAt = new Date(Date.now() + timeoutMinutes * 60 * 1000);

    req.session.checkoutDraft = {
      token: checkoutToken,
      idempotencyKey,
      products: Array.isArray(products) ? products.map((item) => ({
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        quantity: parseInt(item.quantity, 10) || 1
      })) : [],
      totalPrice,
      userInfo,
      note,
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString()
    };

    res.render("client/pages/checkout/payment.pug", {
      user: req.user,
      userInfo: userInfo,
      products: products,
      totalPrice: totalPrice,
      shippingFee: 0,
      checkoutToken
    });
  } catch (error) {
    console.error(error);
    res.redirect("/checkout/payment-info");
  }
};

// [POST] /checkout/order
module.exports.order = async (req, res) => {
  try {
    const checkoutDraft = req.session.checkoutDraft;
    const checkoutToken = req.body.checkoutToken;

    if (!checkoutDraft || checkoutDraft.token !== checkoutToken) {
      req.flash("thatbai", "Phiên thanh toán đã hết hạn hoặc đã được sử dụng.");
      return res.redirect("/checkout/payment-info");
    }

    const draftExpiresAt = new Date(checkoutDraft.expiresAt || checkoutDraft.createdAt || Date.now());
    if (draftExpiresAt.getTime() <= Date.now()) {
      delete req.session.checkoutDraft;
      req.flash("thatbai", "Phiên thanh toán đã hết hạn. Vui lòng bắt đầu lại.");
      return res.redirect("/checkout/payment-info");
    }

    const rawMethod = String(req.body.paymentMethod || "cod");
    const paymentMethod = rawMethod === "cod" ? "cod" : "vnpay";
    const paymentChannel = req.body.paymentChannel || (paymentMethod === "cod" ? "COD" : "VNPay");

    const { order, paymentUrl } = await paymentService.createOrderFromCheckoutDraft({
      user: req.user,
      draft: checkoutDraft,
      paymentMethod,
      paymentChannel,
      clientIp: paymentService.getClientIp(req)
    });

    delete req.session.checkoutDraft;

    if (paymentMethod === "cod") {
      const io = req.app.get("io");
      if (io) {
        io.emit("new_order", {
          customerName: order.userInfo.fullName,
          productTitle: order.products[0]?.title,
          productImage: order.products[0]?.thumbnail
        });
      }

      return res.redirect("/checkout/success?orderId=" + order._id);
    }

    return res.redirect(paymentUrl);
  } catch (error) {
    if (error?.code === 11000 && req.session.checkoutDraft?.idempotencyKey) {
      const existedOrder = await Order.findOne({
        idempotencyKey: req.session.checkoutDraft.idempotencyKey
      });
      if (existedOrder) {
        delete req.session.checkoutDraft;
        if (existedOrder.paymentMethod === "vnpay" && existedOrder.paymentStatus === "pending") {
          return res.redirect("/checkout/pending?orderId=" + existedOrder._id);
        }
        return res.redirect("/checkout/success?orderId=" + existedOrder._id);
      }
    }

    console.error(error);
    req.flash("thatbai", error.message || "Không thể tạo đơn hàng.");
    res.redirect("/checkout/fail");
  }
};

module.exports.success = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    let find = {
      deleted: false,
    };

    if (orderId) {
      find._id = orderId;
      find.user_id = req.user.id; // Bắt buộc phải khớp user_id để tránh ID-scrolling
    } else {
      find.user_id = req.user.id;
    }

    const order = await Order.findOne(find).sort({
      createdAt: -1,
    }).lean();

    if (!order) {
      return res.redirect("/");
    }

    res.render("client/pages/checkout/success", {
      order: paymentService.buildOrderViewModel(order),
    });
  } catch (error) {
    console.error("SUCCESS PAGE ERROR:", error);
    res.redirect("/");
  }
};

module.exports.pending = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    if (!orderId) return res.redirect("/");

    const order = await Order.findOne({
      _id: orderId,
      user_id: req.user.id,
      deleted: false
    }).lean();

    if (!order) {
      return res.redirect("/");
    }

    if (order.paymentStatus === "paid") {
      return res.redirect("/checkout/success?orderId=" + order._id);
    }

    if (order.paymentStatus === "failed" || order.paymentStatus === "expired") {
      return res.redirect("/checkout/fail?orderId=" + order._id);
    }

    res.render("client/pages/checkout/pending", {
      order: paymentService.buildOrderViewModel(order)
    });
  } catch (error) {
    console.error("PENDING PAGE ERROR:", error);
    res.redirect("/");
  }
};

module.exports.fail = async (req, res) => {
  const orderId = req.query.orderId;
  let order = null;
  if (orderId && req.user?.id) {
    order = await Order.findOne({
      _id: orderId,
      user_id: req.user.id,
      deleted: false
    }).lean();
  }

  res.render("client/pages/checkout/fail", {
    order: paymentService.buildOrderViewModel(order) || {},
    error: {
      code: req.query.code || "PAYMENT_FAILED",
      message: req.query.message || "Giao dịch chưa được ngân hàng xác nhận thành công."
    }
  });
};

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
      const io = req.app.get("io");
      if (io) {
        io.emit("new_order", {
          customerName: order.userInfo.fullName,
          productTitle: order.products[0]?.title,
          productImage: order.products[0]?.thumbnail
        });
      }
      return res.redirect("/checkout/success?orderId=" + order._id);
    }

    if (order.paymentStatus === "failed" || order.paymentStatus === "expired") {
      return res.redirect(`/checkout/fail?orderId=${order._id}&code=${verify.vnp_ResponseCode || "FAILED"}`);
    }

    if (verify.isSuccess) {
      return res.redirect("/checkout/pending?orderId=" + order._id);
    }

    return res.redirect(`/checkout/fail?orderId=${order._id}&code=${verify.vnp_ResponseCode || "FAILED"}&message=${encodeURIComponent(verify.message || "Thanh toán không thành công.")}`);

  } catch (error) {
    console.error("VNPAY RETURN ERROR:", error);
    res.redirect("/checkout/fail");
  }
};

module.exports.vnpayReturn = paymentController.vnpayReturn;
