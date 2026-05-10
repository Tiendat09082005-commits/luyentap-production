const Conversation = require("../../models/conversation.model");
const User = require("../../models/user.model");
const Message = require("../../models/message.model");


// [GET] admin/message
module.exports.index = async (req, res) => {
  try {
    // 1. Lấy tất cả các cuộc trò chuyện (non-deleted)
    let conversations = await Conversation
      .find({ deleted: false })
      .populate("user_id", "fullName");

    // 2. Với mỗi conversation, đồng bộ lại lastMessage nếu thiếu
    for (let i = 0; i < conversations.length; i++) {
        const conv = conversations[i].toObject(); // Convert to plain object for easier manipulation
        if (!conv.lastMessage || !conv.lastMessage.content || !conv.lastMessage.createdAt) {
            const latestMsg = await Message.findOne({
                conversation_id: conv._id
            }).sort({ createdAt: -1 });

            if (latestMsg) {
                const lastMsgData = {
                    content: latestMsg.content,
                    sender_role: latestMsg.sender_role,
                    createdAt: latestMsg.createdAt
                };
                
                // Cập nhật vào đối tượng hiện tại để render
                conversations[i].lastMessage = lastMsgData;
                
                // Cập nhật luôn vào DB để lần sau không phải sync lại
                await Conversation.updateOne(
                    { _id: conv._id },
                    { lastMessage: lastMsgData }
                );
            }
        }
        
        // Gán nameUser cho dễ dùng bên Pug
        conversations[i].nameUser = conversations[i].user_id ? conversations[i].user_id.fullName : "Unknown";
    }

    conversations = conversations.filter((conversation) =>
      conversation.lastMessage &&
      conversation.lastMessage.content &&
      conversation.lastMessage.createdAt
    );

    // 3. Sắp xếp conversations theo thời gian tin nhắn mới nhất (giảm dần)
    conversations.sort((a, b) => {
      const timeA = a.lastMessage && a.lastMessage.createdAt ? new Date(a.lastMessage.createdAt) : new Date(0);
      const timeB = b.lastMessage && b.lastMessage.createdAt ? new Date(b.lastMessage.createdAt) : new Date(0);
      return timeB - timeA;
    });

    // 4. Load messages cho cuộc trò chuyện đầu tiên sau khi đã sắp xếp
    if (conversations.length > 0) {
      const firstConv = conversations[0];
      const messages = await Message.find({
        conversation_id: firstConv._id
      }).sort({ createdAt: 1 });

      firstConv.messages = messages;
      firstConv.unread_admin = 0;

      await Conversation.updateOne(
        { _id: firstConv._id },
        { unread_admin: 0 }
      );
    }

    res.render("admin/pages/message/index", {
      conversations: conversations
    });

  } catch (error) {
    console.log("Error in conversation index:", error);
    res.status(500).send("Server Error");
  }
};

module.exports.loadMessage = async (req, res) => {
  try {

    const conversationId = req.params.conversationId;

    const messages = await Message.find({
      conversation_id: conversationId
    }).sort({ createdAt: 1 });

    const conversation = await Conversation
      .findById(conversationId)
      .populate("user_id", "fullName");

    // reset unread
    await Conversation.updateOne(
      { _id: conversationId },
      { unread_admin: 0 }
    );

    res.json({
      messages,
      fullNameUser: conversation.user_id.fullName
    });

  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
