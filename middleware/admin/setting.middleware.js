const systemConfig = require("../../config/system");
const { validateUpdateSettings } = require("../../validate/admin/setting.validate");

const validateUpdateSettingsMiddleware = (req, res, next) => {
  const errors = validateUpdateSettings(req.body);

  if (errors.length > 0) {
    req.flash("thatbai", errors[0]);
    return res.redirect(req.get("referer") || `${systemConfig.prefixAdmin}/setting`);
  }

  next();
};

module.exports = {
  validateUpdateSettingsMiddleware,
};
