const systemConfig = require("../../config/system");
const { validateDashboardQuery } = require("../../validate/admin/dashboard.validate");

const validateDashboardQueryMiddleware = (req, res, next) => {
  const { errors, value } = validateDashboardQuery(req.query);

  if (errors.length > 0) {
    req.flash("error", errors[0]);
    return res.redirect(`${systemConfig.prefixAdmin}/dashboard`);
  }

  req.dashboardQuery = value;
  next();
};

module.exports = {
  validateDashboardQueryMiddleware
};
