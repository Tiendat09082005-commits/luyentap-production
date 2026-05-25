const express = require("express");
const authMiddleware = require("../../middleware/client/auth.middleware");
const chatUploadMiddleware = require("../../middleware/client/chat-upload.middleware");
const chatController = require("../../controllers/client/chat.controller");

const router = express.Router();

router.get("/conversation", authMiddleware.requireAuth, chatController.getConversation);

router.post(
  "/upload",
  authMiddleware.requireAuth,
  chatUploadMiddleware.handleMulterUpload,
  chatUploadMiddleware.uploadChatFile
);

module.exports = router;
