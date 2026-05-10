const chatService = require("../../services/client/chat.service");

// [GET] /chat
module.exports.index = async (req, res) => {
  try {
    // Đảm bảo conversation được tạo sẵn
    const userId = req.user._id;
    const conversation = await chatService.getOrCreateConversation(userId);
    
    res.render("client/pages/chat/index", {
      pageTitle: "Hỗ trợ khách hàng",
      conversationId: conversation._id
    });
  } catch (error) {
    console.error("Chat Index Error:", error);
    res.redirect("back");
  }
};

//[POST] /chat/start
module.exports.Start = async (req, res) => {
  try {
    const userId = req.user._id;
    const conversation = await chatService.getOrCreateConversation(userId);

    res.status(200).json({
      success: true,
      data: {
        conversation_id: conversation._id
      }
    });
  } catch (error) {
    console.error("Chat Start Error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi khởi tạo trò chuyện"
    });
  }
};


// [POST/GET] /chat/message
module.exports.getMessage = async (req, res) => {
  try {
    const conversationId = req.body.conversationId || req.query.conversationId;
    const userId = req.user._id;
    
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20
    };

    const result = await chatService.getMessages(conversationId, userId, options);

    res.status(200).json({
      success: true,
      data: result.messages,
      pagination: result.pagination
    });
  } catch (error) {
    console.error("Get Messages Error:", error);
    
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống khi lấy tin nhắn"
    });
  }
};
