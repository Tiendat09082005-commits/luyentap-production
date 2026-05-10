const { isValidObjectId } = require("mongoose");

/**
 * Validation middleware for Order API
 */
module.exports.detail = (req, res, next) => {
  const { id } = req.params;

  if (!id || !isValidObjectId(id)) {
    req.flash("error", "ID đơn hàng không hợp lệ.");
    return res.redirect("back");
  }

  if (!req.user || !req.user._id) {
    req.flash("error", "Vui lòng đăng nhập để xem chi tiết đơn hàng.");
    return res.redirect("/user/login");
  }

  next();
};
