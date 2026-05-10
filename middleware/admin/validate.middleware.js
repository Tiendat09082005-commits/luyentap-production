module.exports = (validator) => {
  return (req, res, next) => {
    const errors = validator(req.body);

    if (errors.length > 0) {
      if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
        return res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors,
        });
      } else {
        if (req.flash) {
          req.flash("error", errors[0]);
        }
        return res.redirect(req.get("referer") || "back");
      }
    }

    next();
  };
};