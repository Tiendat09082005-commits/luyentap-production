const cartService = require("../../services/client/cart.service");

// COOKIE SETTINGS
const CART_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

// [GET] /cart/
module.exports.index = async (req, res) => {
  try {
    const userId = req.user?._id;
    const cartId = req.cookies.cartId;

    const [cart, suggestedProducts] = await Promise.all([
      cartService.getCartDetail(userId, cartId),
      cartService.getSuggestedProducts(userId, cartId),
    ]);

    res.render("client/pages/cart/index", {
      cartDetail: cart,
      suggestedProducts,
    });
  } catch (error) {
    console.error("Cart Index Error:", error);
    res.redirect("/products");
  }
};

// [POST] /cart/add
module.exports.addPost = async (req, res) => {
  try {
    const productId = req.body.productId;
    const variantId = req.body.variantId || null;
    const quantity = parseInt(req.body.quantity) || 1;

    if (!productId || quantity < 1) {
      throw new Error("Dữ liệu không hợp lệ");
    }

    const userId = req.user?._id;
    let cartId = req.cookies.cartId;

    const cart = await cartService.addToCart(userId, cartId, productId, variantId, quantity);

    // If no cart cookie and guest, set it
    if (!userId && !cartId) {
      res.cookie("cartId", cart._id.toString(), CART_COOKIE_OPTIONS);
    }

    const message = "Bạn đã thêm thành công sản phẩm vào giỏ";

    if (req.xhr || req.headers.accept?.includes("json")) {
      return res.status(200).json({
        success: true,
        message,
        cartCount: cart.products.length
      });
    }

    req.flash("thanhcong", message);
    res.redirect(`/products/detail/${productId}`);
  } catch (error) {
    console.error("Add to Cart Error:", error);
    const errorMessage = error.message || "Hệ thống xảy ra lỗi khi thêm vào giỏ";
    
    if (req.xhr || req.headers.accept?.includes("json")) {
      return res.status(400).json({ success: false, message: errorMessage });
    }
    
    req.flash("thatbai", errorMessage);
    res.redirect("back");
  }
};

// [GET] /cart/delete/:productId/:variantId?
module.exports.deletedPost = async (req, res) => {
  try {
    const { productId, variantId } = req.params;
    const userId = req.user?._id;
    const cartId = req.cookies.cartId;

    await cartService.deleteItem(userId, cartId, productId, variantId);

    req.flash("thanhcong", "Xóa sản phẩm thành công");
    res.redirect("/cart");
  } catch (error) {
    console.error("Delete Cart Item Error:", error);
    req.flash("thatbai", "Xóa sản phẩm thất bại");
    res.redirect("/cart");
  }
};

// [POST] /cart/update/:productId/:quantity/:variantId?
module.exports.updatePost = async (req, res) => {
  try {
    const { productId, quantity, variantId } = req.params;
    const newQty = parseInt(quantity);
    
    if (isNaN(newQty) || newQty < 1) {
      return res.status(400).json({ success: false, message: "Số lượng không hợp lệ" });
    }

    const userId = req.user?._id;
    const cartId = req.cookies.cartId;

    const result = await cartService.updateQuantity(userId, cartId, productId, variantId, newQty);

    return res.status(200).json({
      success: true,
      ...result,
      message: "Cập nhật thành công"
    });
  } catch (error) {
    console.error("Update Cart Quantity Error:", error);
    return res.status(error.message.includes("không tìm thấy") ? 404 : 500).json({
      success: false,
      message: error.message || "Lỗi hệ thống"
    });
  }
};

// [GET] /cart/count
module.exports.getCount = async (req, res) => {
  try {
    const userId = req.user?._id;
    const cartId = req.cookies.cartId;
    
    const count = await cartService.getCartCount(userId, cartId);
    res.status(200).json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, count: 0 });
  }
};
