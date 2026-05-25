const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    guestInfo: {
      name: {
        type: String,
        trim: true,
        default: "",
      },
      phone: {
        type: String,
        trim: true,
        default: "",
      },
    },

    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
      index: true,
    },

    lastMessage: {
      content: {
        type: String,
        trim: true,
        default: "",
      },
      sentAt: {
        type: Date,
        default: null,
      },
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
      },
    },

    lastMessageAt: {
      type: Date,
      default: Date.now,
    },

    unreadCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    assignedAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      default: null,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({ status: 1, updatedAt: -1 });
conversationSchema.index({ assignedAdmin: 1, status: 1 });
conversationSchema.index({ lastMessageAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

const Conversation = mongoose.model("Conversation", conversationSchema, "conversations");

module.exports = Conversation;
