const crypto = require("crypto");
const mongoose = require("mongoose");
const { dateFormat } = require("vnpay");
const Order = require("../models/order.model");
const Product = require("../models/products.model");
const ProductVariant = require("../models/productVariant.model");
const Cart = require("../models/cart.model");
const Setting = require("../models/setting.model");
const vnpay = require("../helpers/vnpay");
const { ProductCode } = require("vnpay");
const priceNewHelper = require("../helpers/priceNew");

const DEFAULT_ONLINE_PAYMENT_TIMEOUT_MINUTES = Number(process.env.ONLINE_PAYMENT_TIMEOUT_MINUTES || 15);
const RECONCILIATION_LOOKBACK_MINUTES = Number(process.env.PAYMENT_RECON_LOOKBACK_MINUTES || 60);
const RECONCILIATION_BATCH_LIMIT = Number(process.env.PAYMENT_RECON_BATCH_LIMIT || 20);

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

async function getOnlinePaymentTimeoutMinutes() {
  const setting = await Setting.findOne({ singletonKey: "site" })
    .select("onlinePaymentTimeoutMinutes")
    .lean();

  const timeoutMinutes = Number(setting?.onlinePaymentTimeoutMinutes);
  if (Number.isFinite(timeoutMinutes) && timeoutMinutes > 0) {
    return timeoutMinutes;
  }

  return DEFAULT_ONLINE_PAYMENT_TIMEOUT_MINUTES;
}

function buildOrderCode() {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const suffix = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `TXO-${stamp}-${suffix}`;
}

function buildRequestId(prefix = "REQ") {
  return `${prefix}-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
}

function getClientIp(req) {
  return req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "127.0.0.1";
}

function normalizeGatewayValue(value) {
  return value == null ? "" : String(value);
}

function normalizeAmount(rawAmount) {
  return Math.round(Number(rawAmount || 0) / 100);
}

function isGatewaySuccess(payload) {
  return String(payload?.vnp_ResponseCode || "") === "00" &&
    String(payload?.vnp_TransactionStatus || payload?.vnp_ResponseCode || "") === "00";
}

function getPaymentMethodLabel(order) {
  if (!order) return "Chưa chọn";
  if (order.paymentMethod === "cod") return "Thanh toán khi nhận hàng (COD)";
  if (order.paymentMethod === "vnpay") {
    if (order.paymentChannel) {
      return `VNPay - ${order.paymentChannel}`;
    }
    return "VNPay";
  }
  return "Chưa chọn";
}

function getPaymentStatusLabel(status) {
  const map = {
    pending: "Chờ thanh toán",
    paid: "Đã thanh toán",
    failed: "Thanh toán thất bại",
    expired: "Hết hạn thanh toán"
  };
  return map[status] || status || "Chưa xác định";
}

async function removePurchasedItemsFromCart({ userId, products, session }) {
  if (!userId || !Array.isArray(products) || products.length === 0) return;

  const cart = await Cart.findOne({ user_id: String(userId) }).session(session);
  if (!cart || !Array.isArray(cart.products)) return;

  // Lọc bỏ những sản phẩm đã được mua
  cart.products = cart.products.filter(cartItem => {
    const isPurchased = products.some(purchasedItem => {
      const matchProduct = String(cartItem.product_id) === String(purchasedItem.product_id);
      
      const cartHasVariant = cartItem.variant_id && String(cartItem.variant_id).trim() !== "";
      const purchasedHasVariant = purchasedItem.variant_id && String(purchasedItem.variant_id).trim() !== "";
      
      if (cartHasVariant !== purchasedHasVariant) {
        return false;
      }
      
      if (cartHasVariant && purchasedHasVariant) {
        return String(cartItem.variant_id) === String(purchasedItem.variant_id);
      }
      
      return matchProduct;
    });
    
    return !isPurchased;
  });

  await cart.save({ session });
}

async function reserveStockAndBuildProducts(items, session) {
  const orderProducts = [];
  let totalPrice = 0;

  for (const rawItem of items) {
    const productId = String(rawItem.product_id || "");
    const variantId = rawItem.variant_id ? String(rawItem.variant_id) : "";
    const quantity = Math.max(1, parseInt(rawItem.quantity, 10) || 1);

    const product = await Product.findOne({
      _id: productId,
      deleted: false,
      status: "active"
    }).session(session);

    if (!product) {
      throw new Error("Sản phẩm không tồn tại hoặc đã ngừng bán.");
    }

    let price = Number(product.price || 0);
    let discount = Number(product.discount || 0);
    let thumbnail = product.thumbnail || "";

    if (variantId) {
      const variant = await ProductVariant.findOne({
        _id: variantId,
        product_id: product._id,
        deleted: false,
        status: "active"
      }).session(session);

      if (!variant) {
        throw new Error(`Biến thể của ${product.title} không còn khả dụng.`);
      }

      const variantReserve = await ProductVariant.updateOne(
        {
          _id: variant._id,
          stock: { $gte: quantity }
        },
        {
          $inc: { stock: -quantity }
        },
        { session }
      );

      if (variantReserve.modifiedCount !== 1) {
        throw new Error(`Sản phẩm ${product.title} không đủ tồn kho.`);
      }

      price = Number(variant.price || 0);
      discount = Number(variant.discount || 0);
      thumbnail = variant.thumbnail || thumbnail;
    } else {
      const productReserve = await Product.updateOne(
        {
          _id: product._id,
          stock: { $gte: quantity }
        },
        {
          $inc: { stock: -quantity }
        },
        { session }
      );

      if (productReserve.modifiedCount !== 1) {
        throw new Error(`Sản phẩm ${product.title} không đủ tồn kho.`);
      }
    }

    const finalPrice = priceNewHelper.priceNew(price, discount);
    totalPrice += finalPrice * quantity;

    orderProducts.push({
      product_id: product._id,
      variant_id: variantId ? new mongoose.Types.ObjectId(variantId) : null,
      title: product.title,
      thumbnail,
      price,
      discountPercentage: discount,
      priceNew: finalPrice,
      finalPrice,
      quantity
    });
  }

  return { orderProducts, totalPrice };
}

async function releaseReservedStock(order, session) {
  if (!order || order.stockReservationStatus !== "reserved") return false;

  for (const item of order.products || []) {
    if (item.variant_id) {
      await ProductVariant.updateOne(
        { _id: item.variant_id },
        { $inc: { stock: Number(item.quantity || 0) } },
        { session }
      );
    } else {
      await Product.updateOne(
        { _id: item.product_id },
        { $inc: { stock: Number(item.quantity || 0) } },
        { session }
      );
    }
  }

  order.stockReservationStatus = "released";
  order.releasedAt = new Date();
  return true;
}

class PaymentService {
  getPaymentMethodLabel(order) {
    return getPaymentMethodLabel(order);
  }

  getPaymentStatusLabel(status) {
    return getPaymentStatusLabel(status);
  }

  async createOrderFromCheckoutDraft({ user, draft, paymentMethod, paymentChannel, clientIp }) {
    if (!user?._id) {
      throw new Error("Bạn cần đăng nhập để thanh toán.");
    }

    if (!draft || !Array.isArray(draft.products) || draft.products.length === 0) {
      throw new Error("Phiên thanh toán đã hết hạn. Vui lòng thử lại.");
    }

    const session = await mongoose.startSession();
    let order;
    let paymentUrl = "";
    const timeoutMinutes = await getOnlinePaymentTimeoutMinutes();

    try {
      await session.withTransaction(async () => {
        const now = new Date();
        const expiresAt = addMinutes(now, timeoutMinutes);
        const orderCode = buildOrderCode();
        const vnpCreateDate = dateFormat(now);
        const vnpExpireDate = dateFormat(expiresAt);

        const { orderProducts, totalPrice } = await reserveStockAndBuildProducts(draft.products, session);

        const orderData = {
          orderCode,
          idempotencyKey: draft.idempotencyKey,
          user_id: user._id,
          note: draft.note || "",
          userInfo: draft.userInfo,
          products: orderProducts,
          totalPrice,
          paymentMethod,
          paymentChannel,
          paymentStatus: paymentMethod === "cod" ? "pending" : "pending",
          stockReservationStatus: paymentMethod === "cod" ? "consumed" : "reserved",
          reservedAt: now,
          expiresAt: paymentMethod === "vnpay" ? expiresAt : null,
          paymentMeta: {
            provider: paymentMethod === "vnpay" ? "vnpay" : "cod",
            vnpCreateDate: paymentMethod === "vnpay" ? vnpCreateDate : null,
            vnpExpireDate: paymentMethod === "vnpay" ? vnpExpireDate : null
          }
        };

        if (paymentMethod === "vnpay") {
          paymentUrl = vnpay.buildPaymentUrl({
            vnp_Amount: totalPrice,
            vnp_IpAddr: clientIp,
            vnp_TxnRef: orderCode,
            vnp_OrderInfo: `Thanh toan don hang ${orderCode}`,
            vnp_OrderType: ProductCode.Other,
            vnp_ReturnUrl: process.env.VNP_RETURNURL,
            vnp_CreateDate: vnpCreateDate,
            vnp_ExpireDate: vnpExpireDate
          });
        }

        const [createdOrder] = await Order.create([orderData], { session });
        order = createdOrder;

        if (paymentMethod === "cod") {
          await removePurchasedItemsFromCart({
            userId: user._id,
            products: createdOrder.products,
            session
          });
        }
      });
    } finally {
      await session.endSession();
    }

    return { order, paymentUrl };
  }

  async storeReturnObservation(orderCode, payload) {
    if (!orderCode) return null;

    return Order.findOneAndUpdate(
      { orderCode },
      {
        $set: {
          "paymentMeta.lastReturnAt": new Date(),
          "paymentMeta.returnPayload": payload,
          "paymentMeta.providerTransactionNo": normalizeGatewayValue(payload.vnp_TransactionNo),
          "paymentMeta.providerBankCode": normalizeGatewayValue(payload.vnp_BankCode),
          "paymentMeta.providerCardType": normalizeGatewayValue(payload.vnp_CardType),
          "paymentMeta.providerPayDate": normalizeGatewayValue(payload.vnp_PayDate),
          "paymentMeta.lastResponseCode": normalizeGatewayValue(payload.vnp_ResponseCode),
          "paymentMeta.lastTransactionStatus": normalizeGatewayValue(payload.vnp_TransactionStatus || payload.vnp_ResponseCode)
        }
      },
      { new: true }
    );
  }

  async applyWebhookResult({ orderCode, payload, source = "ipn" }) {
    const order = await Order.findOne({ orderCode });
    if (!order) {
      return { ok: false, code: "ORDER_NOT_FOUND" };
    }

    const gatewayAmount = normalizeAmount(payload.vnp_Amount);
    if (gatewayAmount !== Number(order.totalPrice || 0)) {
      return { ok: false, code: "INVALID_AMOUNT", order };
    }

    const session = await mongoose.startSession();
    let updatedOrder = null;
    let stateChanged = false;

    try {
      await session.withTransaction(async () => {
        const freshOrder = await Order.findById(order._id).session(session);
        if (!freshOrder) {
          throw new Error("Order not found during transaction.");
        }

        freshOrder.paymentMeta = freshOrder.paymentMeta || {};
        freshOrder.paymentMeta.provider = "vnpay";
        freshOrder.paymentMeta.providerTransactionNo = normalizeGatewayValue(payload.vnp_TransactionNo);
        freshOrder.paymentMeta.providerBankCode = normalizeGatewayValue(payload.vnp_BankCode);
        freshOrder.paymentMeta.providerCardType = normalizeGatewayValue(payload.vnp_CardType);
        freshOrder.paymentMeta.providerPayDate = normalizeGatewayValue(payload.vnp_PayDate);
        freshOrder.paymentMeta.lastResponseCode = normalizeGatewayValue(payload.vnp_ResponseCode);
        freshOrder.paymentMeta.lastTransactionStatus = normalizeGatewayValue(payload.vnp_TransactionStatus || payload.vnp_ResponseCode);
        freshOrder.paymentMeta.webhookPayload = payload;
        freshOrder.paymentMeta.lastWebhookAt = source === "ipn" ? new Date() : freshOrder.paymentMeta.lastWebhookAt;

        if (freshOrder.paymentStatus === "paid") {
          updatedOrder = freshOrder;
          await freshOrder.save({ session });
          return;
        }

        const success = isGatewaySuccess(payload);
        if (success) {
          if (freshOrder.stockReservationStatus !== "reserved") {
            freshOrder.paymentMeta.reconciliation = {
              lastCheckedAt: new Date(),
              lastStatus: "manual_review",
              note: "Received success callback after reservation was released."
            };
            updatedOrder = freshOrder;
            await freshOrder.save({ session });
            return;
          }

          freshOrder.paymentStatus = "paid";
          freshOrder.stockReservationStatus = "consumed";
          freshOrder.paidAt = new Date();
          freshOrder.failedAt = null;
          freshOrder.releasedAt = null;
          stateChanged = true;
          updatedOrder = freshOrder;
          await freshOrder.save({ session });

          await removePurchasedItemsFromCart({
            userId: freshOrder.user_id,
            products: freshOrder.products,
            session
          });
          return;
        }

        if (freshOrder.paymentStatus === "failed" || freshOrder.paymentStatus === "expired") {
          updatedOrder = freshOrder;
          await freshOrder.save({ session });
          return;
        }

        const isExpired = freshOrder.expiresAt && freshOrder.expiresAt <= new Date();
        freshOrder.paymentStatus = isExpired ? "expired" : "failed";
        freshOrder.failedAt = new Date();
        await releaseReservedStock(freshOrder, session);
        stateChanged = true;
        updatedOrder = freshOrder;
        await freshOrder.save({ session });
      });
    } finally {
      await session.endSession();
    }

    return { ok: true, code: updatedOrder?.paymentStatus || "processed", order: updatedOrder, stateChanged };
  }

  async expireOrder(orderId, note = "timeout") {
    const session = await mongoose.startSession();
    let updatedOrder = null;

    try {
      await session.withTransaction(async () => {
        const order = await Order.findOne({
          _id: orderId,
          paymentMethod: "vnpay",
          paymentStatus: "pending"
        }).session(session);

        if (!order) return;

        order.paymentMeta = order.paymentMeta || {};
        order.paymentMeta.reconciliation = {
          lastCheckedAt: new Date(),
          lastStatus: "expired",
          note
        };
        order.paymentStatus = "expired";
        order.failedAt = new Date();
        await releaseReservedStock(order, session);
        updatedOrder = order;
        await order.save({ session });
      });
    } finally {
      await session.endSession();
    }

    return updatedOrder;
  }

  async expireTimedOutOrders(limit = RECONCILIATION_BATCH_LIMIT) {
    const expiredOrders = await Order.find({
      deleted: false,
      paymentMethod: "vnpay",
      paymentStatus: "pending",
      expiresAt: { $lte: new Date() }
    })
      .sort({ expiresAt: 1 })
      .limit(limit)
      .select("_id");

    let count = 0;
    for (const item of expiredOrders) {
      const updated = await this.expireOrder(item._id, "auto_timeout");
      if (updated) count += 1;
    }
    return count;
  }

  async reconcilePendingOrders(limit = RECONCILIATION_BATCH_LIMIT) {
    const threshold = addMinutes(new Date(), -RECONCILIATION_LOOKBACK_MINUTES);
    const pendingOrders = await Order.find({
      deleted: false,
      paymentMethod: "vnpay",
      paymentStatus: "pending",
      reservedAt: { $gte: threshold },
      "paymentMeta.providerTransactionNo": { $ne: "" }
    })
      .sort({ updatedAt: 1 })
      .limit(limit);

    let count = 0;
    for (const order of pendingOrders) {
      try {
        const queryResult = await vnpay.queryDr({
          vnp_RequestId: buildRequestId("RECON"),
          vnp_TxnRef: order.orderCode,
          vnp_OrderInfo: `Thanh toan don hang ${order.orderCode}`,
          vnp_CreateDate: Number(order.paymentMeta?.vnpCreateDate),
          vnp_TransactionDate: Number(order.paymentMeta?.vnpCreateDate),
          vnp_IpAddr: "127.0.0.1",
          vnp_TransactionNo: Number(order.paymentMeta?.providerTransactionNo)
        });

        await Order.updateOne(
          { _id: order._id },
          {
            $set: {
              "paymentMeta.reconciliation.lastCheckedAt": new Date(),
              "paymentMeta.reconciliation.lastStatus": normalizeGatewayValue(queryResult.vnp_TransactionStatus),
              "paymentMeta.reconciliation.note": normalizeGatewayValue(queryResult.message || queryResult.vnp_Message)
            }
          }
        );

        if (queryResult.isVerified) {
          await this.applyWebhookResult({
            orderCode: order.orderCode,
            payload: queryResult,
            source: "reconciliation"
          });
          count += 1;
        }
      } catch (error) {
        await Order.updateOne(
          { _id: order._id },
          {
            $set: {
              "paymentMeta.reconciliation.lastCheckedAt": new Date(),
              "paymentMeta.reconciliation.lastStatus": "error",
              "paymentMeta.reconciliation.note": error.message
            }
          }
        );
      }
    }

    return count;
  }

  buildOrderViewModel(order) {
    if (!order) return null;
    const plainOrder = typeof order.toObject === "function" ? order.toObject() : order;
    return {
      ...plainOrder,
      paymentMethodText: getPaymentMethodLabel(plainOrder),
      paymentStatusText: getPaymentStatusLabel(plainOrder.paymentStatus)
    };
  }

  createCheckoutToken() {
    return crypto.randomUUID();
  }

  async getCheckoutTimeoutMinutes() {
    return getOnlinePaymentTimeoutMinutes();
  }

  getClientIp(req) {
    return getClientIp(req);
  }
}

module.exports = new PaymentService();
