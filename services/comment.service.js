const Comment = require("../models/comment.model");
const {
  buildCommentTree,
  paginateRootComments,
  COMMENT_ROOT_PAGE_LIMIT,
} = require("../helpers/comment.helper");

async function getProductCommentsTree(productId, options = {}) {
  const page = options.page || 1;
  const limit = options.limit || COMMENT_ROOT_PAGE_LIMIT;

  const comments = await Comment.find({ productId })
    .populate("userId", "fullName avatar")
    .sort({ createdAt: 1 })
    .lean();

  const commentTree = buildCommentTree(comments);
  return paginateRootComments(commentTree, page, limit);
}

module.exports = {
  getProductCommentsTree,
};
