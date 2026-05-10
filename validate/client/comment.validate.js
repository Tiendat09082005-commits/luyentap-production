const { isValidObjectId } = require("mongoose");
const xss = require("xss");

/**
 * Validation for Comment API
 */
module.exports.create = (req, res, next) => {
  const { productId, parentId, content } = req.body;

  if (!productId || !isValidObjectId(productId)) {
    return res.status(400).json({
      success: false,
      message: "productId không hợp lệ."
    });
  }

  if (parentId && !isValidObjectId(parentId)) {
    return res.status(400).json({
      success: false,
      message: "parentId không hợp lệ."
    });
  }

  if (!content || content.trim() === "") {
    return res.status(400).json({
      success: false,
      message: "Nội dung bình luận không được để trống."
    });
  }

  if (content.length > 1000) {
    return res.status(400).json({
      success: false,
      message: "Nội dung tối đa 1000 ký tự."
    });
  }

  // Sanitize XSS
  req.body.content = xss(content.trim());

  next();
};

module.exports.index = (req, res, next) => {
  const { productId } = req.query;

  if (!productId || !isValidObjectId(productId)) {
    return res.status(400).json({
      success: false,
      message: "productId không hợp lệ."
    });
  }

  // Sanitize pagination
  req.query.page = Math.max(1, parseInt(req.query.page) || 1);
  req.query.limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));

  next();
};
