/**
 * Validation middleware for User Authentication and Profile
 */

module.exports.register = (req, res, next) => {
  const { fullName, email, password } = req.body;

  if (!fullName || fullName.trim() === "") {
    req.flash("thatbai", "Họ tên không được để trống");
    return res.redirect("back");
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    req.flash("thatbai", "Email không hợp lệ");
    return res.redirect("back");
  }

  if (!password || password.length < 8) {
    req.flash("thatbai", "Mật khẩu phải có ít nhất 8 ký tự");
    return res.redirect("back");
  }

  next();
};

module.exports.login = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    req.flash("thatbai", "Vui lòng nhập đầy đủ email và mật khẩu");
    return res.redirect("back");
  }

  next();
};

module.exports.resetPassword = (req, res, next) => {
  const { email, otp, newPassword, confirmPassword } = req.body;

  if (!email || !otp || !newPassword || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng nhập đầy đủ thông tin",
    });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "Mật khẩu xác nhận không khớp",
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: "Mật khẩu phải có ít nhất 8 ký tự",
    });
  }

  next();
};

module.exports.edit = (req, res, next) => {
  const { fullName, currentPassword } = req.body;

  if (!fullName || fullName.trim() === "") {
    req.flash("thatbai", "Họ tên không được để trống");
    return res.redirect("back");
  }

  if (!currentPassword) {
    req.flash("thatbai", "Vui lòng nhập mật khẩu hiện tại để xác nhận");
    return res.redirect("back");
  }

  next();
};