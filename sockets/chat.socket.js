const Message = require("../models/message.model");
const Conversation = require("../models/conversation.model");

module.exports = (io) => {
  io.on("connection", (socket) => {
    
    // Join room for both Admin and User
    socket.on("join_room", async (conversationId) => {
      // Basic validation
      if (!conversationId) return;
      socket.join(conversationId);
    });

    // Send message (unified for Admin and User)
    socket.on("send_message", async (data) => {
      const { conversation_id, sender_role, content } = data;

      if (!conversation_id || !content || !sender_role) return;

      const conversation = await Conversation.findOne({ _id: conversation_id, deleted: false });
      if (!conversation) return;

      // 1. Lưu tin nhắn vào DB
      const newMessage = new Message({
        conversation_id: conversation_id,
        sender_id: sender_role === "admin" ? "admin" : conversation.user_id.toString(), // Admin generally uses "admin" or session user
        sender_role: sender_role,
        content: content,
      });

      await newMessage.save();

      // 2. Cập nhật lại Conversation (lastMessage, unread)
      const updateData = {
        lastMessage: {
          content: content,
          sender_role: sender_role,
          createdAt: newMessage.createdAt
        }
      };

      if (sender_role === "admin") {
        updateData.$inc = { unread_user: 1 };
      } else {
        updateData.$inc = { unread_admin: 1 };
      }

      await Conversation.updateOne(
        { _id: conversation_id },
        updateData
      );

      // 3. Emit cho tất cả client trong room (bao gồm cả người gửi)
      io.to(conversation_id).emit("receive_message", {
        _id: newMessage._id,
        conversation_id: conversation_id,
        sender_role: sender_role,
        content: newMessage.content,
        createdAt: newMessage.createdAt
      });
    });

  });
};
