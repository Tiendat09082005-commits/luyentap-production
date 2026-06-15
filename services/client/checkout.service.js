const userRepository = require("../../repositories/client/user.repository");
const cartRepository = require("../../repositories/client/cart.repository");
const productRepository = require("../../repositories/client/product.repository");
const productVariantRepository = require("../../repositories/client/productVariant.repository");
const priceNewHelper = require("../../helpers/priceNew");
const paymentService = require("../payment.service");

class CheckoutService {
  async getPaymentInfoData(userId, cartId, cartItemIds) {
    let user = null;
    let cart = null;

    if (userId) {
      user = await userRepository.findByIdActive(userId);
    }

    if (user) {
      cart = await cartRepository.findByUserId(user._id);
    } else if (cartId) {
      cart = await cartRepository.findById(cartId);
    }

    if (!cart || !cart.products || cart.products.length === 0) {
      throw new Error("CART_EMPTY");
    }

    const isSelectionMode = cartItemIds && cartItemIds.length > 0;
    
    // 1. Lọc danh sách các sản phẩm cần xử lý
    const selectedItems = cart.products.filter(item => {
      if (!isSelectionMode) return true;
      const itemKey = item.product_id.toString() + (item.variant_id ? `_${item.variant_id}` : "");
      return cartItemIds.includes(itemKey);
    });

    // 2. Thu thập IDs để truy vấn gộp (Bulk Query)
    const productIds = [...new Set(selectedItems.map(item => item.product_id))];
    const variantIds = [...new Set(selectedItems.filter(item => item.variant_id).map(item => item.variant_id))];

    // 3. Thực hiện truy vấn gộp
    const [productsList, variantsList] = await Promise.all([
      productRepository.findActiveProductsByIds(productIds),
      productVariantRepository.findActiveVariantsByIds(variantIds)
    ]);

    // 4. Ánh xạ thành Maps để tra cứu nhanh O(1)
    const productsMap = new Map(productsList.map(p => [p._id.toString(), p]));
    const variantsMap = new Map(variantsList.map(v => [v._id.toString(), v]));

    let products = [];
    let totalPrice = 0;

    // 5. Dựng lại mảng kết quả
    for (let item of selectedItems) {
      const originalProduct = productsMap.get(item.product_id.toString());
      if (!originalProduct) continue;

      // Nhân bản nông đối tượng để tránh mutate kết quả cache lean()
      const productInfo = { ...originalProduct };

      let price = 0;
      let discount = 0;
      let variantInfo = null;

      if (item.variant_id) {
        variantInfo = variantsMap.get(item.variant_id.toString());

        if (variantInfo) {
          price = variantInfo.price;
          discount = variantInfo.discount;
          productInfo.thumbnail = variantInfo.thumbnail || productInfo.thumbnail;
          productInfo.variantAttributes = variantInfo.attributes;
        }
      }

      if (!price && !discount) {
        price = productInfo.price || 0;
        discount = productInfo.discount || 0;
      }

      productInfo.price = price;
      productInfo.discount = discount;
      productInfo.priceNew = priceNewHelper.priceNew(price, discount);
      productInfo.quantity = item.quantity;
      productInfo.variant_id = item.variant_id;
      productInfo.totalPrice = productInfo.priceNew * item.quantity;

      totalPrice += productInfo.totalPrice;
      products.push(productInfo);
    }

    return {
      user,
      products,
      totalPrice
    };
  }

  async prepareCheckoutDraft(products, totalPrice, userInfo, note) {
    const checkoutToken = paymentService.createCheckoutToken();
    const idempotencyKey = paymentService.createCheckoutToken();
    const timeoutMinutes = await paymentService.getCheckoutTimeoutMinutes();
    const expiresAt = new Date(Date.now() + timeoutMinutes * 60 * 1000);

    const formattedProducts = Array.isArray(products)
      ? products.map((item) => ({
          product_id: item.product_id,
          variant_id: item.variant_id || null,
          quantity: parseInt(item.quantity, 10) || 1,
        }))
      : [];

    return {
      token: checkoutToken,
      idempotencyKey,
      products: formattedProducts,
      totalPrice: parseInt(totalPrice) || 0,
      userInfo,
      note: note || "",
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
  }
}

module.exports = new CheckoutService();
