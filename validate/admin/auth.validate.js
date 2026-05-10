const conFig = require("../../config/system");
const {
  getAdminLoginPath,
  normalizeAdminEmail
} = require("../../helpers/admin-session.helper");

const LOGIN_PATH = getAdminLoginPath(conFig.prefixAdmin);

module.exports.loginPost = (req, res, next) => {
  const email = normalizeAdminEmail(req.body.email);
  const password = String(req.body.password || "");

  req.body.email = email;
  req.body.password = password;

  if (!email) {
    req.flash("error", "Vui lòng nhập email");
    return res.redirect(LOGIN_PATH);
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    req.flash("error", "Email không đúng định dạng");
    return res.redirect(LOGIN_PATH);
  }

  if (!password.trim()) {
    req.flash("error", "Vui lòng nhập mật khẩu");
    return res.redirect(LOGIN_PATH);
  }

  if (password.length < 6) {
    req.flash("error", "Mật khẩu phải có ít nhất 6 ký tự");
    return res.redirect(LOGIN_PATH);
  }

  return next();
};
