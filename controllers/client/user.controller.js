const authService = require("../../services/client/auth.service");
const userService = require("../../services/client/user.service");
const { deleteCachedUserByToken } = require("../../middleware/client/auth.middleware");
const flash = require("../../helpers/flash.helper");

// COOKIE OPTIONS
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
};

function setClientSession(req, user) {
  if (!req.session || !user?._id) return;
  req.session.clientUser = {
    _id: user._id.toString(),
    role: "user",
  };
}

// [GET] /user/register
module.exports.register = async (req, res) => {
  res.render("client/pages/user/register", {});
};

// [POST] /user/register
module.exports.registerPost = async (req, res) => {
  try {
    const user = await authService.register(req.body);
    
    res.cookie("tokenUser", user.tokenUser, COOKIE_OPTIONS);
    setClientSession(req, user);
    flash.flashSuccess(req, "Bạn đã đăng kí tài khoản thành công");
    res.redirect("/");
  } catch (error) {
    flash.flashError(req, error.message);
    res.redirect("back");
  }
};

// [GET] /user/login
module.exports.login = async (req, res) => {
  res.render("client/pages/user/login", {});
};

// [POST] /user/login
module.exports.loginPost = async (req, res) => {
  try {
    const { email, password } = req.body;
    const cartId = req.cookies.cartId;

    const user = await authService.login(email, password, cartId);

    res.cookie("tokenUser", user.tokenUser, COOKIE_OPTIONS);
    setClientSession(req, user);
    res.clearCookie("cartId");
    
    flash.flashSuccess(req, "Đăng nhập thành công");
    res.redirect("/");
  } catch (error) {
    flash.flashError(req, error.message);
    res.redirect("back");
  }
};

// [GET] /user/logout
module.exports.logout = async (req, res) => {
  await deleteCachedUserByToken(req.cookies.tokenUser);
  res.clearCookie("tokenUser");
  if (req.session?.clientUser) {
    delete req.session.clientUser;
  }
  res.redirect("/");
};

// [GET] /user/detail/:id
module.exports.detail = async (req, res) => {
  try {
    const { user, orders } = await userService.getUserDetail(req.user._id);

    res.render("client/pages/user/detail", {
      user,
      orders,
    });
  } catch (error) {
    console.error("USER DETAIL ERROR:", error);
    flash.flashError(req, "Có lỗi xảy ra khi tải thông tin người dùng");
    res.redirect("/");
  }
};

// [GET] /user/forgotPassword
module.exports.forgotPassword = async (req, res) => {
  res.render("client/pages/user/forgotPassword", {});
};

// [POST] /user/sendOTP
module.exports.sendOTP = async (req, res) => {
  try {
    await authService.sendOTP(req.body.email);
    return res.status(200).json({
      success: true,
      message: "Gửi OTP thành công",
    });
  } catch (error) {
    return res.status(error.message === "Không tồn tại người dùng" ? 404 : 500).json({
      success: false,
      message: error.message || "Gửi OTP thất bại",
    });
  }
};

// [POST] /user/resetPassword
module.exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    await authService.resetPassword(email, otp, newPassword);

    return res.status(200).json({
      success: true,
      message: "Đặt lại mật khẩu thành công",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Lỗi server",
    });
  }
};

// [POST] /user/edit
module.exports.editPost = async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, ...updateData } = req.body;

    await userService.updateProfile(userId, updateData, currentPassword);

    flash.flashSuccess(req, "Cập nhật thông tin cá nhân thành công");
    res.redirect(`/user/detail/${userId}`);
  } catch (error) {
    flash.flashError(req, error.message);
    res.redirect("back");
  }
};
