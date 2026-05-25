const mongoose = require("mongoose");
const Conversation = require("../models/conversation.model");
const Message = require("../models/message.model");

const EVENTS = {
  CLIENT: {
    JOIN: "chat:join",
    SEND_MESSAGE: "chat:send_message",
    TYPING: "chat:typing",
    STOP_TYPING: "chat:stop_typing",
    SEEN: "chat:seen",
    DELETE_MESSAGE: "chat:delete_message",
    LOAD_MORE: "chat:load_more",
  },
  SERVER: {
    NEW_MESSAGE: "chat:new_message",
    TYPING_INDICATOR: "chat:typing_indicator",
    MESSAGE_DELETED: "chat:message_deleted",
    SEEN_UPDATE: "chat:seen_update",
    UNREAD_COUNT: "chat:unread_count",
  },
};

const ADMIN_DASHBOARD_ROOM = "admin_dashboard";
const MESSAGE_TYPES = new Set(["text", "image", "file", "emoji"]);
const TYPING_IDLE_MS = 2000;
const LOAD_MORE_LIMIT = 10;

function roomName(conversationId) {
  return `conversation:${conversationId}`;
}

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(String(value || ""));
}

function toObjectId(value) {
  return new mongoose.Types.ObjectId(String(value));
}

function getSocketActor(socket) {
  const session = socket.request.session || {};

  if (session.clientUser?._id) {
    return {
      id: String(session.clientUser._id),
      type: "user",
    };
  }

  if (session.user?._id) {
    return {
      id: String(session.user._id),
      type: "admin",
    };
  }

  return null;
}

function normalizePayload(payload = {}) {
  return typeof payload === "object" && payload !== null ? payload : {};
}

function emitAck(callback, payload) {
  if (typeof callback === "function") {
    callback(payload);
  }
}

function ok(data = {}) {
  return {
    ok: true,
    data,
  };
}

function fail(error) {
  return {
    ok: false,
    error: {
      message: error.message || "Socket error",
      status: error.status || 500,
    },
  };
}

function createError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function serializeMessage(message) {
  if (!message) return null;

  return {
    id: String(message._id),
    conversationId: String(message.conversationId),
    senderId: String(message.senderId),
    senderType: message.senderType,
    type: message.type,
    content: message.content || "",
    fileUrl: message.fileUrl || "",
    fileName: message.fileName || "",
    fileSize: message.fileSize || 0,
    status: message.status,
    isDeleted: Boolean(message.isDeleted),
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
}

function serializeConversation(conversation) {
  if (!conversation) return null;

  return {
    id: String(conversation._id),
    userId: String(conversation.userId),
    status: conversation.status,
    lastMessage: conversation.lastMessage || null,
    lastMessageAt: conversation.lastMessageAt,
    unreadCount: conversation.unreadCount || 0,
    assignedAdmin: conversation.assignedAdmin ? String(conversation.assignedAdmin) : null,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}

async function getAccessibleConversation(conversationId, actor) {
  if (!isValidObjectId(conversationId)) {
    throw createError("conversationId khong hop le", 400);
  }

  const query = {
    _id: toObjectId(conversationId),
    status: { $in: ["open", "closed"] },
  };

  if (actor.type === "user") {
    query.userId = toObjectId(actor.id);
  }

  const conversation = await Conversation.findOne(query);
  if (!conversation) {
    throw createError("Khong tim thay cuoc hoi thoai hoac khong co quyen truy cap", 404);
  }

  return conversation;
}

function validateMessagePayload(payload) {
  const type = payload.type || "text";
  const content = String(payload.content || "").trim();
  const fileUrl = String(payload.fileUrl || "").trim();

  if (!MESSAGE_TYPES.has(type)) {
    throw createError("Loai tin nhan khong hop le", 400);
  }

  if ((type === "text" || type === "emoji") && !content) {
    throw createError("Noi dung tin nhan khong duoc de trong", 400);
  }

  if ((type === "image" || type === "file") && !fileUrl) {
    throw createError("fileUrl bat buoc voi tin nhan image/file", 400);
  }

  return {
    type,
    content,
    fileUrl,
    fileName: String(payload.fileName || "").trim(),
    fileSize: Number(payload.fileSize || 0),
  };
}

function makeLastMessage(messageData, actor) {
  if (messageData.type === "text" || messageData.type === "emoji") {
    return messageData.content;
  }

  return messageData.type === "image" ? "[image]" : `[file] ${messageData.fileName || ""}`.trim();
}

async function resolveCursorDate(conversationId, cursor) {
  if (!cursor) return null;

  const cursorAsDate = new Date(cursor);
  if (!Number.isNaN(cursorAsDate.getTime())) {
    return cursorAsDate;
  }

  if (!isValidObjectId(cursor)) {
    throw createError("cursor khong hop le", 400);
  }

  const cursorMessage = await Message.findOne({
    _id: toObjectId(cursor),
    conversationId: toObjectId(conversationId),
  }).select("createdAt");

  if (!cursorMessage) {
    throw createError("cursor khong ton tai", 400);
  }

  return cursorMessage.createdAt;
}

function emitUnreadCount(io, conversation) {
  io.to(ADMIN_DASHBOARD_ROOM).emit(EVENTS.SERVER.UNREAD_COUNT, {
    conversationId: String(conversation._id),
    unreadCount: conversation.unreadCount || 0,
  });
}

module.exports = (io, sessionMiddleware) => {
  if (!sessionMiddleware) {
    throw new Error("Socket session middleware is required");
  }

  const typingTimers = new Map();

  function clearTypingTimer(socketId, conversationId) {
    const key = `${socketId}:${conversationId}`;
    const timer = typingTimers.get(key);

    if (timer) {
      clearTimeout(timer);
      typingTimers.delete(key);
    }
  }

  function scheduleTypingStop(socket, actor, conversationId) {
    clearTypingTimer(socket.id, conversationId);

    const key = `${socket.id}:${conversationId}`;
    const timer = setTimeout(() => {
      typingTimers.delete(key);
      socket.to(roomName(conversationId)).emit(EVENTS.SERVER.TYPING_INDICATOR, {
        conversationId,
        senderId: actor.id,
        senderType: actor.type,
        isTyping: false,
      });
    }, TYPING_IDLE_MS);

    typingTimers.set(key, timer);
  }

  io.use((socket, next) => {
    sessionMiddleware(socket.request, {}, (error) => {
      if (error) return next(error);

      const actor = getSocketActor(socket);
      if (!actor) {
        return next(createError("Authentication required", 401));
      }

      socket.data.actor = actor;
      return next();
    });
  });

  io.on("connection", (socket) => {
    const actor = socket.data.actor;

    if (actor.type === "admin") {
      socket.join(ADMIN_DASHBOARD_ROOM);
    }

    socket.on(EVENTS.CLIENT.JOIN, async (rawPayload = {}, callback) => {
      try {
        const payload = normalizePayload(rawPayload);
        const conversation = await getAccessibleConversation(payload.conversationId, actor);
        const conversationId = String(conversation._id);

        socket.join(roomName(conversationId));
        emitAck(callback, ok({ conversation: serializeConversation(conversation) }));
      } catch (error) {
        emitAck(callback, fail(error));
      }
    });

    socket.on(EVENTS.CLIENT.SEND_MESSAGE, async (rawPayload = {}, callback) => {
      try {
        const payload = normalizePayload(rawPayload);
        const conversation = await getAccessibleConversation(payload.conversationId, actor);
        const messageData = validateMessagePayload(payload);

        const message = await Message.create({
          conversationId: conversation._id,
          senderId: actor.id,
          senderType: actor.type,
          type: messageData.type,
          content: messageData.content,
          fileUrl: messageData.fileUrl,
          fileName: messageData.fileName,
          fileSize: messageData.fileSize,
          status: "sent",
        });

        conversation.lastMessage = {
          content: makeLastMessage(messageData, actor),
          sentAt: message.createdAt,
          senderId: toObjectId(actor.id),
        };
        conversation.status = "open";
        conversation.lastMessageAt = message.createdAt;

        if (actor.type === "user") {
          conversation.unreadCount += 1;
        }

        await conversation.save();

        const serializedMessage = serializeMessage(message);
        const serializedConversation = serializeConversation(conversation);

        socket.join(roomName(conversation._id));
        io.to(roomName(conversation._id)).emit(EVENTS.SERVER.NEW_MESSAGE, {
          message: serializedMessage,
          conversation: serializedConversation,
        });

        if (actor.type === "user") {
          io.to(ADMIN_DASHBOARD_ROOM).except(roomName(conversation._id)).emit(EVENTS.SERVER.NEW_MESSAGE, {
            message: serializedMessage,
            conversation: serializedConversation,
          });
          emitUnreadCount(io, conversation);
        }

        emitAck(callback, ok({ message: serializedMessage, conversation: serializedConversation }));
      } catch (error) {
        emitAck(callback, fail(error));
      }
    });

    socket.on(EVENTS.CLIENT.TYPING, async (rawPayload = {}, callback) => {
      try {
        const payload = normalizePayload(rawPayload);
        const conversation = await getAccessibleConversation(payload.conversationId, actor);
        const conversationId = String(conversation._id);

        socket.to(roomName(conversationId)).emit(EVENTS.SERVER.TYPING_INDICATOR, {
          conversationId,
          senderId: actor.id,
          senderType: actor.type,
          isTyping: true,
        });

        scheduleTypingStop(socket, actor, conversationId);
        emitAck(callback, ok({ conversationId }));
      } catch (error) {
        emitAck(callback, fail(error));
      }
    });

    socket.on(EVENTS.CLIENT.STOP_TYPING, async (rawPayload = {}, callback) => {
      try {
        const payload = normalizePayload(rawPayload);
        const conversation = await getAccessibleConversation(payload.conversationId, actor);
        const conversationId = String(conversation._id);

        clearTypingTimer(socket.id, conversationId);
        socket.to(roomName(conversationId)).emit(EVENTS.SERVER.TYPING_INDICATOR, {
          conversationId,
          senderId: actor.id,
          senderType: actor.type,
          isTyping: false,
        });

        emitAck(callback, ok({ conversationId }));
      } catch (error) {
        emitAck(callback, fail(error));
      }
    });

    socket.on(EVENTS.CLIENT.SEEN, async (rawPayload = {}, callback) => {
      try {
        const payload = normalizePayload(rawPayload);
        const conversation = await getAccessibleConversation(payload.conversationId, actor);
        const conversationId = String(conversation._id);

        await Message.updateMany(
          {
            conversationId: conversation._id,
            senderType: { $ne: actor.type },
            isDeleted: false,
          },
          { status: "seen" }
        );

        if (actor.type === "admin") {
          conversation.unreadCount = 0;
          await conversation.save();
          emitUnreadCount(io, conversation);
        }

        const payloadOut = {
          conversationId,
          seenBy: {
            senderId: actor.id,
            senderType: actor.type,
          },
        };

        io.to(roomName(conversationId)).emit(EVENTS.SERVER.SEEN_UPDATE, payloadOut);
        emitAck(callback, ok(payloadOut));
      } catch (error) {
        emitAck(callback, fail(error));
      }
    });

    socket.on(EVENTS.CLIENT.DELETE_MESSAGE, async (rawPayload = {}, callback) => {
      try {
        const payload = normalizePayload(rawPayload);
        if (!isValidObjectId(payload.messageId)) {
          throw createError("messageId khong hop le", 400);
        }

        const message = await Message.findById(payload.messageId);
        if (!message) {
          throw createError("Khong tim thay tin nhan", 404);
        }

        await getAccessibleConversation(message.conversationId, actor);

        const isOwner = String(message.senderId) === actor.id && message.senderType === actor.type;
        if (!isOwner && actor.type !== "admin") {
          throw createError("Khong co quyen xoa tin nhan", 403);
        }

        message.isDeleted = true;
        await message.save();

        const payloadOut = {
          conversationId: String(message.conversationId),
          messageId: String(message._id),
          deletedBy: {
            senderId: actor.id,
            senderType: actor.type,
          },
        };

        io.to(roomName(message.conversationId)).emit(EVENTS.SERVER.MESSAGE_DELETED, payloadOut);
        io.to(ADMIN_DASHBOARD_ROOM).except(roomName(message.conversationId)).emit(EVENTS.SERVER.MESSAGE_DELETED, payloadOut);
        emitAck(callback, ok(payloadOut));
      } catch (error) {
        emitAck(callback, fail(error));
      }
    });

    socket.on(EVENTS.CLIENT.LOAD_MORE, async (rawPayload = {}, callback) => {
      try {
        const payload = normalizePayload(rawPayload);
        const conversation = await getAccessibleConversation(payload.conversationId, actor);
        const cursorDate = await resolveCursorDate(conversation._id, payload.cursor);

        const query = {
          conversationId: conversation._id,
          isDeleted: false,
        };

        if (cursorDate) {
          query.createdAt = { $lt: cursorDate };
        }

        const messages = await Message.find(query)
          .sort({ createdAt: -1 })
          .limit(LOAD_MORE_LIMIT + 1)
          .lean();

        const hasMore = messages.length > LOAD_MORE_LIMIT;
        const page = messages.slice(0, LOAD_MORE_LIMIT).reverse();
        const nextCursor = hasMore ? page[0]?.createdAt || null : null;

        emitAck(callback, ok({
          conversationId: String(conversation._id),
          messages: page.map(serializeMessage),
          nextCursor,
          hasMore,
        }));
      } catch (error) {
        emitAck(callback, fail(error));
      }
    });

    socket.on("disconnect", () => {
      for (const key of typingTimers.keys()) {
        if (key.startsWith(`${socket.id}:`)) {
          const [, conversationId] = key.split(":");
          clearTypingTimer(socket.id, conversationId);
        }
      }
    });
  });
};

module.exports.EVENTS = EVENTS;
module.exports.ADMIN_DASHBOARD_ROOM = ADMIN_DASHBOARD_ROOM;
