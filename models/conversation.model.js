const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema({

  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],

  lastMessage: {
    content: String,
    sender_role: String,
    createdAt: Date
  },

  last_message: String,
  last_time: Date,
  unread_admin: {
    type: Number,
    default: 0
  },
  unread_user: {
    type: Number,
    default: 0
  },
  deleted: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

module.exports = mongoose.model("Conversation", conversationSchema);
