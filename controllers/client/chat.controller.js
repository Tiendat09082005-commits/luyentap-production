const Conversation = require("../../models/conversation.model");

module.exports.getConversation = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const conversation = await Conversation.findOneAndUpdate(
      { userId },
      {
        $setOnInsert: {
          userId,
          status: "open",
          unreadCount: 0,
          lastMessageAt: new Date(),
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    ).lean();

    // FIX timeout: set session.clientUser để socket middleware nhận diện được user.
    // Socket đọc session.clientUser._id trong getSocketActor() —
    // nếu không set thì actor = null → mọi socket event bị reject 401 → client timeout.
    const serializedUser = {
      _id: String(req.user._id || req.user.id),
      fullName: req.user.fullName || "",
      email: req.user.email || "",
      avatar: req.user.avatar || "",
      tokenUser: req.user.tokenUser || "",
    };

    const existing = req.session.clientUser;
    if (!existing || existing._id !== serializedUser._id) {
      req.session.clientUser = serializedUser;
    }

    return res.json({
      success: true,
      conversation: {
        id: conversation._id.toString(),
        userId: conversation.userId.toString(),
        status: conversation.status,
        unreadCount: conversation.unreadCount || 0,
        lastMessage: conversation.lastMessage || null,
        lastMessageAt: conversation.lastMessageAt,
      },
    });
  } catch (error) {
    console.error("[ClientChat] getConversation failed:", error.message);
    return res.status(500).json({
      success: false,
      message: "Khong the khoi tao chat",
    });
  }
};