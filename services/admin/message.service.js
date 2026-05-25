const mongoose = require("mongoose");
const Conversation = require("../../models/conversation.model");
const Message = require("../../models/message.model");

function escapeRegex(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function ensureObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(String(id || ""))) {
    const error = new Error("ID hội thoại không hợp lệ");
    error.status = 400;
    throw error;
  }

  return new mongoose.Types.ObjectId(String(id));
}

function buildConversationProjection() {
  return {
    _id: 1,
    userId: 1,
    status: 1,
    unreadCount: 1,
    lastMessage: 1,
    lastMessageAt: 1,
    updatedAt: 1,
    "user._id": 1,
    "user.fullName": 1,
    "user.phone": 1,
    "user.email": 1,
    "user.avatar": 1,
  };
}

function serializeConversation(record) {
  if (!record) return null;

  const user = record.user || {};

  return {
    id: String(record._id),
    status: record.status || "open",
    unreadCount: Number(record.unreadCount || 0),
    lastMessage: record.lastMessage || null,
    lastMessageAt: record.lastMessageAt || record.updatedAt || null,
    user: {
      id: user._id ? String(user._id) : String(record.userId || ""),
      fullName: user.fullName || "Khách hàng",
      phone: user.phone || "",
      email: user.email || "",
      avatar: user.avatar || "",
      profileUrl:
        user.email || user.phone
          ? `/admin/accounts/user?keyword=${encodeURIComponent(user.email || user.phone)}`
          : "/admin/accounts/user",
    },
  };
}

async function listConversations(keyword = "") {
  const pipeline = [
    {
      $match: { deletedAt: null, "lastMessage.sentAt": { $ne: null } },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: {
        path: "$user",
        preserveNullAndEmptyArrays: true,
      },
    },
  ];

  const trimmedKeyword = String(keyword || "").trim();
  if (trimmedKeyword) {
    const regex = new RegExp(escapeRegex(trimmedKeyword), "i");
    pipeline.push({
      $match: {
        $or: [
          { "user.fullName": regex },
          { "user.phone": regex },
          { "user.email": regex },
        ],
      },
    });
  }

  pipeline.push(
    {
      $project: buildConversationProjection(),
    },
    {
      $sort: {
        lastMessageAt: -1,
        updatedAt: -1,
      },
    },
  );

  const records = await Conversation.aggregate(pipeline);
  return records.map(serializeConversation);
}

async function getConversationById(conversationId) {
  const record = await Conversation.findOne({
    _id: ensureObjectId(conversationId),
    deletedAt: null,
  })
    .populate("userId", "fullName phone email avatar")
    .lean();

  if (!record) {
    const error = new Error("Không tìm thấy hội thoại");
    error.status = 404;
    throw error;
  }

  return serializeConversation({
    ...record,
    user: record.userId,
  });
}

async function closeConversation(conversationId) {
  const record = await Conversation.findOneAndUpdate(
    {
      _id: ensureObjectId(conversationId),
      deletedAt: null,
    },
    {
      $set: {
        status: "closed",
      },
    },
    {
      new: true,
    },
  )
    .populate("userId", "fullName phone email avatar")
    .lean();

  if (!record) {
    const error = new Error("Không tìm thấy hội thoại");
    error.status = 404;
    throw error;
  }

  return serializeConversation({
    ...record,
    user: record.userId,
  });
}

async function deleteConversation(conversationId) {
  const objectId = ensureObjectId(conversationId);

  const record = await Conversation.findOne({
    _id: objectId,
    deletedAt: null,
  }).lean();

  if (!record) {
    const error = new Error("Không tìm thấy hội thoại");
    error.status = 404;
    throw error;
  }

  await Promise.all([
    Message.deleteMany({ conversationId: objectId }),
    Conversation.deleteOne({ _id: objectId }),
  ]);

  return {
    id: String(objectId),
  };
}

module.exports = {
  listConversations,
  getConversationById,
  closeConversation,
  deleteConversation,
};
