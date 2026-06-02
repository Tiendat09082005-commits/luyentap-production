const { getSettings } = require("../../services/admin/setting.service");

module.exports = async (req, res, next) => {
  try {
    res.locals.siteSettings = await getSettings();
  } catch (error) {
    console.error("[Settings Middleware] Failed to load settings:", error.message);
    res.locals.siteSettings = {};
  }
  next();
};
