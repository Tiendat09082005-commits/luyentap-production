const Comment = require("../models/comment.model");

/**
 * Repository layer for Comment to abstract DB operations
 */
class CommentRepository {
  async create(data) {
    return await Comment.create(data);
  }

  async findById(id, select = "-__v") {
    return await Comment.findById(id).select(select).populate("userId", "fullName avatar").lean();
  }

  async findOne(filter, select = "-__v") {
    return await Comment.findOne(filter).select(select).lean();
  }

  /**
   * Fetch root comments with pagination
   */
  async getRootComments(productId, skip, limit) {
    return await Comment.find({ productId, parentId: null })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "fullName avatar")
      .select("-__v")
      .lean();
  }

  /**
   * Fetch all replies for a set of parent comments
   */
  async getRepliesByParentIds(productId, parentIds) {
    return await Comment.find({ 
      productId, 
      parentId: { $in: parentIds } 
    })
      .sort({ createdAt: 1 })
      .populate("userId", "fullName avatar")
      .select("-__v")
      .lean();
  }

  async countRootComments(productId) {
    return await Comment.countDocuments({ productId, parentId: null });
  }

  /**
   * Suggest Indexes for MongoDB:
   * db.comments.createIndex({ productId: 1, parentId: 1, createdAt: -1 })
   */
}

module.exports = new CommentRepository();
