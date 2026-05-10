const User = require("../../models/user.model");
const Cart = require("../../models/cart.model");
const ForgotPassword = require("../../models/forgotPassword.model");
const bcrypt = require("bcrypt");
const generateHelper = require("../../helpers/generate");
const sendMailHelper = require("../../helpers/sendMail");

const SALT_ROUNDS = 10;

class AuthService {
  /**
   * Register a new user
   */
  async register(userData) {
    const { email, password } = userData;

    const emailExist = await User.findOne({
      email: email,
      deleted: false,
    }).lean();

    if (emailExist) {
      throw new Error("Email đăng kí đã tồn tại");
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = new User({
      ...userData,
      password: hashedPassword,
    });

    await user.save();
    return user;
  }

  /**
   * Login user and handle cart merge
   */
  async login(email, password, guestCartId = null) {
    const user = await User.findOne({
      email: email,
      deleted: false,
    });

    if (!user) {
      throw new Error("Email hoặc mật khẩu không khớp");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Mật khẩu không khớp !!!");
    }

    // Merge cart logic O(n)
    if (guestCartId) {
      await this.mergeCart(user._id, guestCartId);
    }

    return user;
  }

  /**
   * Merge guest cart into user cart using Map for O(n) performance
   */
  async mergeCart(userId, guestCartId) {
    const [cartGuest, cartUser] = await Promise.all([
      Cart.findById(guestCartId),
      Cart.findOne({ user_id: userId }),
    ]);

    if (!cartGuest) return;

    if (!cartUser) {
      cartGuest.user_id = userId;
      await cartGuest.save();
    } else {
      // Create a map for user products for O(1) lookup
      const userProductMap = new Map();
      cartUser.products.forEach((p) => {
        const key = `${p.product_id}_${p.variant_id || ""}`;
        userProductMap.set(key, p);
      });

      // Merge guest products into the map or update quantities
      cartGuest.products.forEach((gp) => {
        const key = `${gp.product_id}_${gp.variant_id || ""}`;
        if (userProductMap.has(key)) {
          userProductMap.get(key).quantity += gp.quantity;
        } else {
          cartUser.products.push(gp);
        }
      });

      await cartUser.save();
      await Cart.findByIdAndDelete(guestCartId);
    }
  }

  /**
   * Send OTP for forgot password
   */
  async sendOTP(email) {
    const userExist = await User.exists({ email, deleted: false });
    if (!userExist) {
      throw new Error("Không tồn tại người dùng");
    }

    const otp = generateHelper.generateOtp(6);
    // Secure OTP: Hash it before saving (using a simple hash or bcrypt)
    const hashedOtp = await bcrypt.hash(otp, 5); // Faster hash for OTP

    await ForgotPassword.create({
      email,
      otp: hashedOtp, // Store hashed OTP
      expireAt: new Date(Date.now() + 3 * 60 * 1000),
    });

    await sendMailHelper(
      email,
      "Mã OTP đặt lại mật khẩu",
      `<h2>Mã OTP của bạn là: ${otp}</h2><p>Mã này sẽ hết hạn sau 3 phút.</p>`,
    );

    return true;
  }

  /**
   * Reset password using OTP
   */
  async resetPassword(email, otp, newPassword) {
    const forgotPassword = await ForgotPassword.findOne({ email }).sort({ createdAt: -1 });

    if (!forgotPassword) {
      throw new Error("OTP không hợp lệ hoặc đã hết hạn");
    }

    if (forgotPassword.expireAt < new Date()) {
      await ForgotPassword.deleteOne({ _id: forgotPassword._id });
      throw new Error("OTP đã hết hạn");
    }

    // Verify hashed OTP
    const isOtpValid = await bcrypt.compare(otp, forgotPassword.otp);
    if (!isOtpValid) {
      throw new Error("OTP không đúng");
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const result = await User.updateOne(
      { email, deleted: false },
      { password: hashedPassword }
    );

    if (result.matchedCount === 0) {
      throw new Error("Không tìm thấy người dùng");
    }

    await ForgotPassword.deleteMany({ email }); // Clear all OTPs for this email
    return true;
  }
}

module.exports = new AuthService();
