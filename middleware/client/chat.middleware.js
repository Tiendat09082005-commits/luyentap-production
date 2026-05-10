const RoomChat = require("../../models/room-chat.model.js");

module.exports.checkRoomPermission = async (req, res, next) => {
  try {
    const roomId = req.params.room_id || req.body.room_id;
    if (!roomId) {
      return next(); // Pass through if creating new room or general chat route
    }

    const room = await RoomChat.findOne({
      _id: roomId,
      deleted: false
    });

    if (!room) {
      return res.status(404).json({ success: false, message: "Phòng chat không tồn tại" });
    }

    const userId = req.user.id;
    const isMember = room.users.some(user => user.user_id === userId);

    if (!isMember) {
      return res.status(403).json({ success: false, message: "Không có quyền truy cập phòng chat này" });
    }

    req.roomChat = room;
    next();
  } catch (error) {
    console.error("checkRoomPermission Error:", error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
};
