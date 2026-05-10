const cleanText = require("./string-strip-html");

const COMMENT_MAX_LENGTH = 1000;
const COMMENT_ROOT_PAGE_LIMIT = 10;
const COMMENT_MAX_REPLY_DEPTH = 2; // root(0) + 2 levels reply = 3 cap

function normalizeCommentContent(content) {
  if (typeof content !== "string") {
    return "";
  }

  const sanitized = cleanText(content);
  return sanitized.replace(/\s+/g, " ").trim();
}

function formatCommentAuthor(user) {
  if (!user) {
    return {
      fullName: "Khach",
      avatar: "",
    };
  }

  return {
    fullName: user.fullName || "Nguoi dung",
    avatar: user.avatar || "",
  };
}

function serializeComment(commentDoc) {
  const comment = typeof commentDoc.toObject === "function"
    ? commentDoc.toObject()
    : { ...commentDoc };

  const user = comment.userId && typeof comment.userId === "object" ? comment.userId : null;

  return {
    _id: comment._id,
    productId: comment.productId,
    userId: user ? user._id : comment.userId || null,
    content: comment.content,
    parentId: comment.parentId || null,
    depth: Number(comment.depth || 0),
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    user: formatCommentAuthor(user),
    replies: Array.isArray(comment.replies) ? comment.replies.map(serializeComment) : [],
  };
}

function buildCommentTree(flatComments) {
  const commentMap = new Map();
  const rootComments = [];

  flatComments.forEach((commentDoc) => {
    const normalizedComment = serializeComment(commentDoc);
    normalizedComment.replies = [];
    commentMap.set(String(normalizedComment._id), normalizedComment);
  });

  flatComments.forEach((commentDoc) => {
    const commentId = String(commentDoc._id);
    const currentComment = commentMap.get(commentId);
    const parentId = commentDoc.parentId ? String(commentDoc.parentId) : null;

    if (parentId && commentMap.has(parentId)) {
      commentMap.get(parentId).replies.push(currentComment);
      return;
    }

    rootComments.push(currentComment);
  });

  const sortComments = (comments) => {
    comments.sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt));
    comments.forEach((comment) => sortComments(comment.replies));
  };

  sortComments(rootComments);
  return rootComments;
}

function paginateRootComments(commentTree, page = 1, limit = COMMENT_ROOT_PAGE_LIMIT) {
  const normalizedPage = Math.max(1, Number(page) || 1);
  const normalizedLimit = Math.min(50, Math.max(1, Number(limit) || COMMENT_ROOT_PAGE_LIMIT));
  const totalRootComments = commentTree.length;
  const totalPages = Math.max(1, Math.ceil(totalRootComments / normalizedLimit));
  const skip = (normalizedPage - 1) * normalizedLimit;

  return {
    comments: commentTree.slice(skip, skip + normalizedLimit),
    pagination: {
      page: normalizedPage,
      limit: normalizedLimit,
      totalRootComments,
      totalPages,
      hasNextPage: normalizedPage < totalPages,
      hasPrevPage: normalizedPage > 1,
    },
  };
}

module.exports = {
  COMMENT_MAX_LENGTH,
  COMMENT_ROOT_PAGE_LIMIT,
  COMMENT_MAX_REPLY_DEPTH,
  normalizeCommentContent,
  serializeComment,
  buildCommentTree,
  paginateRootComments,
};
