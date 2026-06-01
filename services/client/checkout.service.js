const userRepository = require("../../repositories/client/user.repository");
const cartRepository = require("../../repositories/client/cart.repository");
const productRepository = require("../../repositories/client/product.repository");
const productVariantRepository = require("../../repositories/client/productVariant.repository");
const priceNewHelper = require("../../helpers/priceNew");

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
    let products = [];
    let totalPrice = 0;

    for (let item of cart.products) {
      if (isSelectionMode) {
        const itemKey =
          item.product_id.toString() +
          (item.variant_id ? `_${item.variant_id}` : "");
        if (!cartItemIds.includes(itemKey)) continue;
      }

      const productInfo = await productRepository.findActiveProductById(item.product_id);

      if (productInfo) {
        let price = 0;
        let discount = 0;
        let variantInfo = null;

        if (item.variant_id) {
          variantInfo = await productVariantRepository.findActiveVariantById(item.variant_id);

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
    }

    return {
      user,
      products,
      totalPrice
    };
  }
}

module.exports = new CheckoutService();
