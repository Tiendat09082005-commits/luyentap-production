const User = require("../../models/user.model");
const Order = require("../../models/order.model");
const bcrypt = require("bcrypt");

class UserService {
  /**
   * Get user detail and orders
   */
  async getUserDetail(userId) {
    const [user, rawOrders] = await Promise.all([
      User.findOne({ _id: userId, deleted: false }).select("-password -tokenUser").lean(),
      Order.find({ user_id: userId, deleted: false }).sort({ createdAt: -1 }).lean(),
    ]);

    if (!user) {
      throw new Error("Người dùng không tồn tại");
    }

    const orders = this.processOrders(rawOrders);

    return { user, orders };
  }

  /**
   * Process raw orders for UI display
   */
  processOrders(rawOrders) {
    return rawOrders.map((order) => {
      const statusSlug = order.status
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-");

      return {
        ...order,
        id: order._id,
        itemCount: order.products.reduce((acc, p) => acc + (p.quantity || 0), 0),
        statusClass: `status-${statusSlug}`,
        statusText: order.status.charAt(0).toUpperCase() + order.status.slice(1),
      };
    });
  }

  /**
   * Update user profile
   */
  async updateProfile(userId, updateData, currentPassword) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("Người dùng không tồn tại");
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error("Mật khẩu hiện tại không chính xác!");
    }

    // Filter out password from updateData to prevent accidental updates
    const { password, tokenUser, ...safeUpdateData } = updateData;

    await User.updateOne({ _id: userId }, safeUpdateData);
    return true;
  }
}

module.exports = new UserService();
