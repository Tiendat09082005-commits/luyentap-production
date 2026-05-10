module.exports.createGroup = (req, res, next) => {
  const { title, users } = req.body;
  if (!title || title.trim() === "") {
    return res.status(400).json({ success: false, message: "Vui lòng nhập tên nhóm" });
  }
  if (!users || !Array.isArray(users) || users.length < 2) {
    return res.status(400).json({ success: false, message: "Nhóm phải có ít nhất 2 thành viên" });
  }
  next();
};

module.exports.sendMessage = (req, res, next) => {
  const { content, images } = req.body;
  const hasContent = content && content.trim() !== "";
  const hasImages = images && Array.isArray(images) && images.length > 0;
  
  if (!hasContent && !hasImages) {
    return res.status(400).json({ success: false, message: "Vui lòng nhập nội dung tin nhắn" });
  }
  next();
};

module.exports.getMessages = (req, res, next) => {
  const conversationId = req.body.conversationId || req.query.conversationId;
  if (!conversationId) {
    return res.status(400).json({ success: false, message: "Thiếu thông tin cuộc trò chuyện" });
  }
  next();
};
