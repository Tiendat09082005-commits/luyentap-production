const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },
    depth: {
      type: Number,
      default: 0,
      min: 0,
      max: 2,
    },
  },
  {
    timestamps: true,
  }
);

commentSchema.index({ productId: 1, createdAt: 1 });
commentSchema.index({ productId: 1, parentId: 1, createdAt: 1 });

const Comment = mongoose.model("Comment", commentSchema, "comments");

module.exports = Comment;
