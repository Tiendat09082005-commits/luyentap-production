const mongoose = require("mongoose");

const roomChatSchema = new mongoose.Schema({
  title: String,
  avatar: String,
  typeRoom: {
    type: String,
    enum: ["friend", "group", "support"],
    default: "friend"
  },
  status: {
    type: String,
    default: "active"
  },
  users: [
    {
      user_id: String,
      role: {
        type: String,
        enum: ["superAdmin", "admin", "user"],
        default: "user"
      }
    }
  ],
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
}, { timestamps: true });

module.exports = mongoose.model("RoomChat", roomChatSchema, "room-chat");
