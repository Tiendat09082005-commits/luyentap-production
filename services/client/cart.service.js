const Cart = require("../../models/cart.model");
const Product = require("../../models/products.model");
const ProductVariant = require("../../models/productVariant.model");
const priceNewHelper = require("../../helpers/priceNew");

class CartService {
  /**
   * Get the current cart (either from user_id or cookie cartId)
   */
  async getCart(userId, cartId) {
    if (userId) {
      return await Cart.findOne({ user_id: userId });
    }
    if (cartId) {
      return await Cart.findById(cartId);
    }
    return null;
  }

  /**
   * Get full cart details with product and variant info
   */
  async getCartDetail(userId, cartId) {
    let cart = null;
    if (userId) {
      cart = await Cart.findOne({ user_id: userId }).select("products").lean();
    } else if (cartId) {
      cart = await Cart.findById(cartId).select("products").lean();
    }

    if (!cart || !cart.products || cart.products.length === 0) {
      return cart || { products: [] };
    }

    // Optimize: Batch fetch all product and variant info
    const productIds = cart.products.map(item => item.product_id);
    const variantIds = cart.products.map(item => item.variant_id).filter(id => id);

    const [productsInfo, variantsInfo] = await Promise.all([
      Product.find({
        _id: { $in: productIds },
        deleted: false
      }).select("title thumbnail price discount").lean(),
      ProductVariant.find({
        _id: { $in: variantIds },
        deleted: false
      }).lean()
    ]);

    // Use Map for O(n) lookup performance and better key handling
    const productMap = new Map(productsInfo.map(p => [p._id.toString(), p]));
    const variantMap = new Map(variantsInfo.map(v => [v._id.toString(), v]));

    cart.products = cart.products.map(item => {
      const productIdStr = item.product_id.toString();
      const variantIdStr = item.variant_id ? item.variant_id.toString() : null;

      const productInfo = productMap.get(productIdStr);
      const variantInfo = variantIdStr ? variantMap.get(variantIdStr) : null;

      if (!productInfo) return null; // Mark for removal

      const result = {
        ...item,
        productInfo: {
          title: productInfo.title,
          thumbnail: productInfo.thumbnail
        }
      };

      if (variantInfo) {
        result.variantInfo = variantInfo;
        result.variantDisplay = this.formatVariantDisplay(variantInfo.attributes);
        result.price = variantInfo.price;
        result.discount = variantInfo.discount;
        result.thumbnail = variantInfo.thumbnail || productInfo.thumbnail;
      } else {
        result.price = productInfo.price || 0;
        result.discount = productInfo.discount || 0;
        result.thumbnail = productInfo.thumbnail;
      }

      result.priceNew = priceNewHelper.priceNew(result.price, result.discount);
      result.totalPrice = result.priceNew * item.quantity;

      return result;
    }).filter(Boolean); // Remove null items (missing productInfo)

    return cart;
  }

  async getSuggestedProducts(userId, cartId, limit = 4) {
    const cart = await this.getCart(userId, cartId);
    const cartProductIds = new Set(
      (cart?.products || []).map((item) => item.product_id.toString())
    );

    let products = await Product.find({
      deleted: false,
      status: "active",
      _id: { $nin: Array.from(cartProductIds) }
    })
      .populate("brand_id", "title")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    if (products.length < limit) {
      const excludedIds = new Set([
        ...Array.from(cartProductIds),
        ...products.map((product) => product._id.toString())
      ]);
      const fallbackProducts = await Product.find({
        deleted: false,
        status: "active",
        _id: {
          $nin: Array.from(excludedIds)
        }
      })
        .populate("brand_id", "title")
        .sort({ createdAt: -1 })
        .limit(limit - products.length)
        .lean();

      products = products.concat(fallbackProducts);
    }

    if (products.length === 0) {
      return [];
    }

    const productIds = products.map((product) => product._id);
    const variants = await ProductVariant.find({
      product_id: { $in: productIds },
      deleted: false,
      status: "active"
    }).lean();

    const variantMap = new Map();
    for (const variant of variants) {
      const key = variant.product_id.toString();
      const current = variantMap.get(key);
      const candidatePriceNew = priceNewHelper.priceNew(variant.price || 0, variant.discount || 0);

      if (!current || candidatePriceNew < current.priceNew) {
        variantMap.set(key, {
          price: variant.price || 0,
          discount: variant.discount || 0,
          priceNew: candidatePriceNew,
          thumbnail: variant.thumbnail || ""
        });
      }
    }

    return products.map((product) => {
      const variantInfo = variantMap.get(product._id.toString());
      const price = variantInfo ? variantInfo.price : Number(product.price || 0);
      const discount = variantInfo ? variantInfo.discount : Number(product.discount || 0);
      const priceNew = variantInfo
        ? variantInfo.priceNew
        : priceNewHelper.priceNew(price, discount);

      return {
        _id: product._id,
        title: product.title,
        thumbnail: variantInfo?.thumbnail || product.thumbnail,
        brand: product.brand_id?.title || "TIDA",
        price,
        discount,
        priceNew
      };
    });
  }

  /**
   * Add a product/variant to cart
   */
  async addToCart(userId, cartId, productId, variantId, quantity) {
    let cart = await this.getCart(userId, cartId);

    if (!cart) {
      cart = await Cart.create({
        user_id: userId || null,
        products: []
      });
    }

    const index = cart.products.findIndex(p => 
      p.product_id.toString() === productId && 
      (variantId ? p.variant_id?.toString() === variantId : !p.variant_id)
    );

    if (index >= 0) {
      cart.products[index].quantity += quantity;
    } else {
      cart.products.push({
        product_id: productId,
        variant_id: variantId || null,
        quantity
      });
    }

    await cart.save();
    return cart;
  }

  /**
   * Update quantity of an item in cart
   */
  async updateQuantity(userId, cartId, productId, variantId, quantity) {
    const cart = await this.getCart(userId, cartId);
    if (!cart) throw new Error("Giỏ hàng không tìm thấy");

    const index = cart.products.findIndex(p => 
      p.product_id.toString() === productId && 
      (variantId ? p.variant_id?.toString() === variantId : !p.variant_id)
    );

    if (index === -1) throw new Error("Sản phẩm không có trong giỏ hàng");

    cart.products[index].quantity = quantity;
    await cart.save();

    // Calculate new price for the updated item
    let itemPriceInfo = null;
    if (variantId) {
      itemPriceInfo = await ProductVariant.findById(variantId).select("price discount").lean();
    } else {
      itemPriceInfo = await Product.findById(productId).select("price discount").lean();
    }

    const price = itemPriceInfo?.price || 0;
    const discount = itemPriceInfo?.discount || 0;
    const priceNew = priceNewHelper.priceNew(price, discount);

    return {
      newQty: quantity,
      itemTotalPrice: priceNew * quantity
    };
  }

  /**
   * Delete an item from cart
   */
  async deleteItem(userId, cartId, productId, variantId) {
    const pullCondition = { product_id: productId };
    pullCondition.variant_id = variantId || null;

    const query = userId ? { user_id: userId } : { _id: cartId };
    return await Cart.updateOne(query, { $pull: { products: pullCondition } });
  }

  /**
   * Get total number of unique items in cart
   */
  async getCartCount(userId, cartId) {
    const cart = await this.getCart(userId, cartId);
    return cart?.products?.length || 0;
  }

  /**
   * Format variant attributes for display
   */
  formatVariantDisplay(attributes) {
    if (!attributes) return "";
    if (attributes instanceof Map) {
      return Array.from(attributes.values()).join(", ");
    }
    return Object.values(attributes).join(", ");
  }
}

module.exports = new CartService();
