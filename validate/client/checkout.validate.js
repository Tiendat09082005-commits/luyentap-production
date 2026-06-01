module.exports.validatePaymentInfo = (req, res, next) => {
  const rawCartItemIds = req.query.cartItemIds || req.body.cartItemIds;
  
  if (rawCartItemIds) {
    req.cartItemIds = Array.isArray(rawCartItemIds) ? rawCartItemIds : [rawCartItemIds];
  } else {
    req.cartItemIds = [];
  }
  
  next();
};
