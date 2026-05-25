const conFig = require("../../config/system");
const {
  buildAdminSessionUser,
  getAdminDashboardPath,
  getAdminLoginPath
} = require("../../helpers/admin-session.helper");

const LOGIN_PATH = getAdminLoginPath(conFig.prefixAdmin);
const DASHBOARD_PATH = getAdminDashboardPath(conFig.prefixAdmin);
const MAX_SESSION_AGE = 5 * 60 * 1000;

function redirectToLogin(req, res) {
  req.session.destroy((err) => {
    if (err) {
      console.error("Session destroy error:", err);
    }

    res.clearCookie("connect.sid");
    return res.redirect(LOGIN_PATH);
  });
}

module.exports.requireAuth = async (req, res, next) => {
  try {
    if (!req.session.user?._id) {
      return res.redirect(LOGIN_PATH);
    }

    let sessionUser = req.session.user;
    const now = Date.now();
    const lastSync = sessionUser._lastSync || 0;

    if (now - lastSync > MAX_SESSION_AGE) {
      const freshUser = await buildAdminSessionUser(sessionUser._id);

      if (!freshUser) {
        req.flash("error", "Phien dang nhap da het hieu luc");
        return redirectToLogin(req, res);
      }

      sessionUser = {
        ...freshUser,
        _lastSync: now
      };

      req.session.user = sessionUser;
    }

    res.locals.user = sessionUser;
    res.locals.roles = sessionUser.roles || { title: "", permissions: [] };
    res.locals.permissionSet = new Set(sessionUser.roles?.permissions || []);

    return next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    req.flash("error", "Khong the xac thuc phien dang nhap");
    return redirectToLogin(req, res);
  }
};

module.exports.authLogin = module.exports.requireAuth;

module.exports.checkPermission = (permission) => {
  return (req, res, next) => {
    const permissionSet = res.locals.permissionSet;

    if (!permissionSet?.has(permission)) {
      req.flash("error", "Ban khong co quyen thuc hien hanh dong nay");
      return res.redirect(DASHBOARD_PATH);
    }

    return next();
  };
};

module.exports.checkAnyPermission = (permissions = []) => {
  return (req, res, next) => {
    const permissionSet = res.locals.permissionSet;
    const hasPermission = permissions.some((permission) => permissionSet?.has(permission));

    if (!hasPermission) {
      req.flash("error", "Ban khong co quyen thuc hien hanh dong nay");
      return res.redirect(DASHBOARD_PATH);
    }

    return next();
  };
};
