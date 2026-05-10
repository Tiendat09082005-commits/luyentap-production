const Conversation = require("../../models/conversation.model");
const Message = require("../../models/message.model");

class ChatService {

  // Get or create a conversation for a user
  async getOrCreateConversation(userId) {
    // Atomic findOne and update to handle initialization/repair of participants if needed
    let conversation = await Conversation.findOneAndUpdate(
      { user_id: userId },
      { $addToSet: { participants: userId } }, // Ensure user is in participants
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).select("_id participants user_id").lean();

    return conversation;
  }

  //Get paginated messages for a conversation
  async getMessages(conversationId, userId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    // 1. Verify conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId)
      .select("_id user_id participants")
      .lean();

    if (!conversation) {
      throw { status: 404, message: "Không tìm thấy cuộc trò chuyện" };
    }

    const participantIds = Array.isArray(conversation.participants)
      ? conversation.participants.map(p => p.toString())
      : [conversation.user_id?.toString()].filter(Boolean);

    if (!participantIds.includes(userId.toString())) {
      throw { status: 403, message: "Bạn không có quyền truy cập cuộc trò chuyện này" };
    }

    // 2. Fetch paginated messages
    const [messages, total] = await Promise.all([
      Message.find({ conversation_id: conversationId })
        .sort({ createdAt: -1 }) // Newest first for chat
        .skip(skip)
        .limit(limit)
        .select("content sender_role sender_id createdAt")
        .lean(),
      Message.countDocuments({ conversation_id: conversationId })
    ]);

    // 3. Reset unread count for user
    await Conversation.updateOne(
      { _id: conversationId },
      { unread_user: 0 }
    );

    return {
      messages: messages.reverse(),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}


module.exports = new ChatService();
