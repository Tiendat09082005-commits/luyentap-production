const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },

    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    senderType: {
      type: String,
      enum: ["user", "admin"],
      required: true,
    },

    type: {
      type: String,
      enum: ["text", "image", "file", "emoji"],
      default: "text",
    },

    content: {
      type: String,
      trim: true,
      default: "",
    },

    fileUrl: {
      type: String,
      trim: true,
      default: "",
    },

    fileName: {
      type: String,
      trim: true,
      default: "",
    },

    fileSize: {
      type: Number,
      default: 0,
      min: 0,
    },

    status: {
      type: String,
      enum: ["sending", "sent", "seen"],
      default: "sent",
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ conversationId: 1, isDeleted: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, senderType: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema, "messages");

module.exports = Message;
