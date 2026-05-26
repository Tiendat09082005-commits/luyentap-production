const {
  validateCreateCategoryRequest,
  validateEditCategoryRequest,
} = require("../../validate/admin/product-category.validate");

const validateCreate = (req, res, next) => {
  const errors = validateCreateCategoryRequest(req.body);

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors[0],
    });
  }

  next();
};

const validateEdit = (req, res, next) => {
  const errors = validateEditCategoryRequest(req.params, req.body);

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors[0],
    });
  }

  next();
};

module.exports = {
  validateCreate,
  validateEdit,
};
