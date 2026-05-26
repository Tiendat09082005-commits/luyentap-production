const { validateDeleteOrder , validateSuggest , validateGetOrderDetail   } = require("../../validate/admin/order.validate");

const validateDeleteOrderMiddleware = (req, res, next) => {
    const errors = validateDeleteOrder(req.body);

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: errors[0]
        });
    }

    next();
};


const validateSuggestMiddleware = (req, res, next) => {
  const errors = validateSuggest(req.query) || [];

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors[0]
    });
  }


  req.validated = {
    keyword: req.query.keyword.trim()
  };

  next();
};


const flash = require("../../helpers/flash.helper");

const validateGetOrderDetailMiddleware = (req, res, next) => {
  const errors = validateGetOrderDetail(req.query) || [];

  if (errors.length > 0) {
    flash.flashError(req, errors[0]);
    return res.redirect("back");
  }

  req.validated = {
    orderId: req.query.order_id
  };

  next();
};


module.exports = {
    validateDeleteOrderMiddleware,
    validateSuggestMiddleware,
    validateGetOrderDetailMiddleware
};