const express = require("express");
const authMiddleware = require("../../middleware/admin/auth.middleware");
const chatUploadMiddleware = require("../../middleware/client/chat-upload.middleware");
const controller = require("../../controllers/admin/message.controller");

const router = express.Router();

router.get("/", authMiddleware.checkPermission("messages_support"), controller.index);
router.get("/conversations", authMiddleware.checkPermission("messages_support"), controller.getConversations);
router.get("/conversations/:id", authMiddleware.checkPermission("messages_support"), controller.getConversation);
router.patch("/conversations/:id/close", authMiddleware.checkPermission("messages_support"), controller.closeConversation);
router.delete("/conversations/:id", authMiddleware.checkPermission("messages_support"), controller.deleteConversation);
router.post(
  "/upload",
  authMiddleware.checkPermission("messages_support"),
  chatUploadMiddleware.handleMulterUpload,
  controller.uploadFile
);

module.exports = router;
