const commentService = require("../../services/client/comment.service");
const rateLimiterService = require("../../services/rateLimiter.service");

function getRequesterKey(req) {
  if (req.user?._id) return `user:${req.user._id}`;
  const forwardedFor = req.headers["x-forwarded-for"];
  const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : (forwardedFor || req.ip || "guest");
  return `guest:${ip.split(",")[0].trim()}`;
}

// [POST] /comments
module.exports.create = async (req, res) => {
  try {
    const { productId } = req.body;

    const rateLimited = await rateLimiterService.isRateLimited(
      `comments:create:${getRequesterKey(req)}:prod:${productId}`,
      5,
      60
    );

    if (rateLimited) {
      return res.status(429).json({
        code: 429,
        success: false,
        message: "Bạn thao tác quá nhanh. Vui lòng thử lại sau 1 phút."
      });
    }

    const comment = await commentService.createComment(req.body, req.user?._id);

    return res.status(201).json({
      code: 201,
      success: true,
      message: "Tạo bình luận thành công.",
      data: comment,
      comment
    });
  } catch (error) {
    console.error("Create Comment Controller Error:", error);

    if (error.status) {
      return res.status(error.status).json({
        code: error.status,
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      code: 500,
      success: false,
      message: "Lỗi hệ thống khi tạo bình luận."
    });
  }
};

// [GET] /comments
module.exports.index = async (req, res) => {
  try {
    const { productId, page, limit } = req.query;

    const result = await commentService.getCommentsTree(productId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    });

    if (result?.pagination) {
      result.pagination.totalRootComments = Number(
        result.pagination.totalRootComments ??
        result.pagination.total ??
        0
      );
    }

    return res.status(200).json({
      code: 200,
      success: true,
      data: result.comments,
      comments: result.comments,
      pagination: result.pagination
    });
  } catch (error) {
    console.error("Get Comments Controller Error:", error);
    return res.status(500).json({
      code: 500,
      success: false,
      message: "Lỗi hệ thống khi lấy danh sách bình luận."
    });
  }
};
