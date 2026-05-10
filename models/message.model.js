const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({

  conversation_id: {
    type: String,
    required: true
  },
  sender_id: {
    type: String,
    required: true
  },
  sender_role: {
    type: String,
    enum: ["user", "admin"],
    default: "user"
  },
  content: {
    type: String
  },
  images: {
    type: Array,
    default: []
  },
  deletedBy: {
    type: Array, // [user_id]
    default: []
  },
  deletedForAll: {
    type: Boolean,
    default: false
  },
  is_read: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);
