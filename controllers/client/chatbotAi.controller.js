const aiService = require("../../services/client/chatbotAi.service");

/**
 * Endpoint điều phối các yêu cầu hội thoại AI từ Client
 * [POST] /api/ai/chat-search (hoặc các route tương tự)
 */
module.exports.ChatSearch = async (req, res) => {
    try {
        const { type, content, metadata } = req.body;
        let replyMessage = "";

        switch (type) {
            case "PRODUCT_SEARCH":
                replyMessage = await aiService.handleProductSearch(metadata, req.user);
                break;
            case "PRODUCT_COMPARE":
                replyMessage = await aiService.handleProductCompare(content);
                break;
            case "STORE_POLICY":
                replyMessage = await aiService.handleStorePolicy();
                break;
            case "GENERAL_KNOWLEDGE":
                replyMessage = await aiService.handleGeneralKnowledge(content);
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: "Unknown intent type"
                });
        }

        return res.status(200).json({
            success: true,
            reply: replyMessage
        });

    } catch (error) {
        console.error("[ChatbotAiController] Lỗi trong ChatSearch:", error);
        return res.status(500).json({
            success: false,
            reply: "Rất tiếc, hệ thống đang gặp sự cố khi xử lý câu hỏi của bạn. Bạn vui lòng thử lại sau giây lát!"
        });
    }
};