const chatUploadMiddleware = require("../../middleware/client/chat-upload.middleware");
const messageService = require("../../services/admin/message.service");

module.exports.index = async (req, res) => {
  return res.render("admin/pages/messages/index", {
    pageTitle: "Hỗ trợ khách hàng",
    adminChatBootstrap: {
      adminId: String(req.session.user?._id || ""),
      conversationId: String(req.query.conversationId || ""),
    },
  });
};

module.exports.getConversations = async (req, res) => {
  try {
    const conversations = await messageService.listConversations(req.query.q);

    return res.json({
      success: true,
      conversations,
    });
  } catch (error) {
    console.error("[AdminMessages] getConversations failed:", error.message);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Không thể tải danh sách hội thoại",
    });
  }
};

module.exports.getConversation = async (req, res) => {
  try {
    const conversation = await messageService.getConversationById(req.params.id);

    return res.json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("[AdminMessages] getConversation failed:", error.message);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Không thể tải hội thoại",
    });
  }
};

module.exports.closeConversation = async (req, res) => {
  try {
    const conversation = await messageService.closeConversation(req.params.id);

    return res.json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("[AdminMessages] closeConversation failed:", error.message);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Không thể đóng hội thoại",
    });
  }
};

module.exports.deleteConversation = async (req, res) => {
  try {
    const result = await messageService.deleteConversation(req.params.id);

    return res.json({
      success: true,
      conversation: result,
    });
  } catch (error) {
    console.error("[AdminMessages] deleteConversation failed:", error.message);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Không thể xóa hội thoại",
    });
  }
};

module.exports.uploadFile = chatUploadMiddleware.uploadChatFile;