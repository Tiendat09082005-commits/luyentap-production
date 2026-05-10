const conFig = require("../../config/system");
const authService = require("../../services/admin/auth.service");
const {
  getAdminDashboardPath,
  getAdminLoginPath,
  normalizeAdminEmail,
} = require("../../helpers/admin-session.helper");

const LOGIN_PATH = getAdminLoginPath(conFig.prefixAdmin);
const DASHBOARD_PATH = getAdminDashboardPath(conFig.prefixAdmin);

function getLoginRateLimitKey(req, email) {
  const forwardedFor = req.headers["x-forwarded-for"];
  const ipAddress = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : String(forwardedFor || req.ip || "unknown")
        .split(",")[0]
        .trim();

  return `admin-login:${ipAddress}:${normalizeAdminEmail(email)}`;
}

// [GET] admin/auth/login
module.exports.login = async (req, res) => {
  if (req.session.user) {
    return res.redirect(DASHBOARD_PATH);
  }

  return res.render("admin/pages/auth/login", {
    pageTitle: "Dang nhap admin",
  });
};

// [POST] admin/auth/login
module.exports.loginPost = async (req, res) => {
  const email = normalizeAdminEmail(req.body.email);
  const password = req.body.password;
  const rateLimitKey = getLoginRateLimitKey(req, email);

  try {
    const sessionUser = await authService.loginAdmin({
      email,
      password,
      rateLimitKey,
      req,
    });

    // 👉 convert callback → promise
    await new Promise((resolve, reject) => {
      req.session.regenerate((err) => {
        if (err) return reject(err);

        req.session.user = sessionUser;

        req.session.save((err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });

    req.flash("thanhcong", "Đăng nhập thành công!");
    return res.redirect(DASHBOARD_PATH);
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    let message = "Lỗi hệ thống, vui lòng thử lại";

    switch (error.message) {
      case "RATE_LIMIT":
        message = "Bạn đăng nhập quá nhanh, thử lại sau 1 phút";
        break;
      case "INVALID_CREDENTIALS":
        message = "Email hoặc mật khẩu không chính xác";
        break;
      case "ACCOUNT_INACTIVE":
        message = "Tài khoản bị khóa hoặc chưa kích hoạt";
        break;
      case "INVALID_SESSION_USER":
        message = "Tài khoản không hợp lệ";
        break;
    }

    req.flash("error", message);
    return res.redirect(LOGIN_PATH);
  }
};

// [POST] admin/auth/logout
module.exports.logout = async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) return reject(err);
        resolve();
      });
    });

  } catch (error) {
    console.error("Logout error:", error);
  }

  res.clearCookie(req.session?.cookie?.name || "connect.sid");

  return res.redirect(LOGIN_PATH);
};
