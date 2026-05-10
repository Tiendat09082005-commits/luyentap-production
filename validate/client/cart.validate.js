const Product = require("../../models/products.model");
const ProductVariant = require("../../models/productVariant.model");


module.exports.checkStockAdd = async (req, res, next) => {
  try {
    const { productId, quantity, variantId } = req.body;
    const stockAdd = parseInt(quantity);
    const isAjax = req.xhr || (req.headers.accept && req.headers.accept.indexOf("json") > -1);

    // validate quantity
    if (isNaN(stockAdd) || stockAdd <= 0) {
      if (isAjax) return res.json({ code: 400, message: "Số lượng không hợp lệ" });
      req.flash("thatbai", "Số lượng không hợp lệ");
      return res.redirect("back");
    }

    let stockAvailable = 0;

    if (variantId) {
      const variant = await ProductVariant.findOne({
        _id: variantId,
        product_id: productId,
        deleted: false
      }).select("stock");
      if (!variant) {
        if (isAjax) return res.json({ code: 404, message: "Biến thể không tồn tại" });
        req.flash("thatbai", "Biến thể không tồn tại");
        return res.redirect("back");
      }
      stockAvailable = variant.stock;
    } else {
      const product = await Product.findOne({
        _id: productId,
        deleted: false
      }).select("stock");
      if (!product) {
        if (isAjax) return res.json({ code: 404, message: "Sản phẩm không tồn tại" });
        req.flash("thatbai", "Sản phẩm không tồn tại");
        return res.redirect("back");
      }
      // Lưu ý: Nếu hệ thống luôn dùng variant, stock trên Product có thể là 0 hoặc không dùng. 
      // Ở đây ưu tiên lấy stock của chính Product nếu không có variantId.
      stockAvailable = product.stock || 0;
    }

    if (stockAdd > stockAvailable) {
      if (isAjax) return res.json({ code: 400, message: "Số lượng vượt quá tồn kho" });
      req.flash("thatbai", `Số lượng vượt quá tồn kho (Còn lại: ${stockAvailable})`);
      return res.redirect("back");
    }


    next();
  } catch (error) {
    console.error("Validation error:", error);
    next(error);
  }
};

module.exports.checkStockUpdate = async (req, res, next) => {
  try {
    const { productId, quantity, variantId } = req.params;
    const stockUpdate = parseInt(quantity);

    let stockAvailable = 0;

    if (variantId) {
      const variant = await ProductVariant.findOne({
        _id: variantId,
        product_id: productId,
        deleted: false
      }).select("stock");
      if (!variant) {
        req.flash("thatbai", "Biến thể không tồn tại");
        return res.redirect("/cart");
      }
      stockAvailable = variant.stock;
    } else {
      const product = await Product.findOne({
        _id: productId,
        deleted: false
      }).select("stock");
      if (!product) {
        req.flash("thatbai", "Sản phẩm không tồn tại");
        return res.redirect("/cart");
      }
      stockAvailable = product.stock || 0;
    }

    if (stockUpdate > stockAvailable) {
      req.flash("thatbai", `Số lượng vượt quá tồn kho (Còn lại: ${stockAvailable})`);
      return res.redirect("/cart");
    }

    next();
  } catch (error) {
    console.error("Update validation error:", error);
    res.redirect("/cart");
  }
};

