module.exports.validatePaymentInfo = (req, res, next) => {
  const rawCartItemIds = req.query?.cartItemIds || req.body?.cartItemIds;
  
  if (rawCartItemIds) {
    req.cartItemIds = Array.isArray(rawCartItemIds) ? rawCartItemIds : [rawCartItemIds];
  } else {
    req.cartItemIds = [];
  }
  
  next();
};

module.exports.validatePayment = (req, res, next) => {
  const { userInfo, products } = req.body;
  
  if (!userInfo?.fullName || !userInfo?.phone || !userInfo?.address) {
    req.flash("thatbai", "Vui lòng nhập đầy đủ thông tin giao hàng.");
    return res.redirect("/checkout/payment-info");
  }
  
  if (!Array.isArray(products) || products.length === 0) {
    req.flash("thatbai", "Đơn hàng trống hoặc không hợp lệ.");
    return res.redirect("/checkout/payment-info");
  }
  
  next();
};
