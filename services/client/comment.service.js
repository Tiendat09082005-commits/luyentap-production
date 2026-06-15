const CommentRepository = require("../../repositories/comment.repository");
const Product = require("../../models/products.model");
const { client: redisClient, getIsReady } = require("../../config/redis");
const { serializeComment } = require("../../helpers/comment.helper");

class CommentService {
  /**
   * Get comments tree with caching and optimized DB queries
   */
  async getCommentsTree(productId, options = {}) {
    const { page = 1, limit = 10 } = options;
    const cacheKey = `comments:product:${productId}:page:${page}:limit:${limit}`;

    // 1. Try Cache
    if (getIsReady()) {
      const cached = await redisClient.get(cacheKey);
      if (cached) return JSON.parse(cached);
    }

    // 2. DB Fetch - Step 1: Paginate Root Comments
    const skip = (page - 1) * limit;
    const [rootComments, totalRoot] = await Promise.all([
      CommentRepository.getRootComments(productId, skip, limit),
      CommentRepository.countRootComments(productId)
    ]);

    if (!rootComments.length) {
      const result = { comments: [], pagination: this.formatPagination(totalRoot, page, limit) };
      if (getIsReady()) await redisClient.setEx(cacheKey, 3600, JSON.stringify(result));
      return result;
    }

    // 3. DB Fetch - Step 2: Fetch ALL replies for these roots in one query
    // This avoids N+1 queries. We fetch up to 3 levels as per requirements.
    const rootIds = rootComments.map(c => c._id.toString());
    
    // We can use a recursive approach or a flat fetch for all descendents
    // For 2-3 levels, fetching all comments for this product might be okay if not too many,
    // but better to fetch by parentId hierarchy.
    const allComments = [...rootComments];
    let parentIdsToFetch = [...rootIds];

    // Fetch Level 1 Replies
    const level1 = await CommentRepository.getRepliesByParentIds(productId, parentIdsToFetch);
    allComments.push(...level1);
    
    // Fetch Level 2 Replies (if depth limit allows)
    const level1Ids = level1.map(c => c._id.toString());
    if (level1Ids.length > 0) {
      const level2 = await CommentRepository.getRepliesByParentIds(productId, level1Ids);
      allComments.push(...level2);
    }

    // 4. Build Tree O(n)
    const commentTree = this.buildTree(allComments, null);

    const result = {
      comments: commentTree,
      pagination: this.formatPagination(totalRoot, page, limit)
    };

    // 5. Save Cache
    if (getIsReady()) {
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(result));
    }

    return result;
  }

  /**
   * Create a new comment/reply
   */
  async createComment(data, userId) {
    const { productId, parentId, content, rating } = data;

    // 1. Validate Product
    const productExists = await Product.exists({ _id: productId, deleted: false, status: "active" });
    if (!productExists) throw { status: 404, message: "Sản phẩm không tồn tại." };

    let depth = 0;
    if (parentId) {
      const parent = await CommentRepository.findOne({ _id: parentId, productId });
      if (!parent) throw { status: 404, message: "Không tìm thấy bình luận cha." };
      
      depth = (parent.depth || 0) + 1;
      if (depth > 2) throw { status: 400, message: "Chỉ cho phép tối đa 3 cấp bình luận." };
    }

    // 2. Atomic Create
    const parsedRating = parentId ? null : (Number(rating) || null);
    const comment = await CommentRepository.create({
      productId,
      userId,
      content,
      parentId: parentId || null,
      depth,
      rating: parsedRating
    });

    // 3. Recalculate Average Rating if it's a root review
    if (!parentId && parsedRating) {
      const CommentModel = require("../../models/comment.model");
      const reviews = await CommentModel.find({
        productId,
        parentId: null,
        rating: { $ne: null }
      }).select("rating").lean();

      if (reviews.length > 0) {
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const avg = totalRating / reviews.length;
        await Product.updateOne({ _id: productId }, { rating: Number(avg.toFixed(1)) });
      }
    }

    // 4. Invalidate Cache for this product
    this.invalidateProductCache(productId);

    return await CommentRepository.findById(comment._id);
  }

  /**
   * O(n) Tree Building
   */
  buildTree(flatComments, parentId = null) {
    const map = new Map();
    flatComments.forEach(c => map.set(c._id.toString(), { ...serializeComment(c), replies: [] }));
    
    const tree = [];
    map.forEach(item => {
      if (item.parentId === parentId || (parentId === null && !item.parentId)) {
        tree.push(item);
      } else if (map.has(item.parentId?.toString())) {
        map.get(item.parentId.toString()).replies.push(item);
      }
    });
    
    return tree;
  }

  formatPagination(total, page, limit) {
    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total
    };
  }

  async invalidateProductCache(productId) {
    if (!getIsReady()) return;
    try {
      // Find all keys for this product and delete them
      let cursor = 0;
      const pattern = `comments:product:${productId}:*`;
      do {
        const reply = await redisClient.scan(cursor, { MATCH: pattern, COUNT: 100 });
        cursor = reply.cursor;
        const keys = reply.keys;
        if (keys.length > 0) {
          await redisClient.del(keys);
        }
      } while (cursor !== 0);
    } catch (err) {
      console.error("[Redis] Cache invalidation failed:", err);
    }
  }
}

module.exports = new CommentService();
