const User = require("../../models/user.model");

const findByIdActive = async (userId) => {
  return User.findOne({ _id: userId, deleted: false }).select("-password -tokenUser").lean();
};

const findById = async (userId) => {
  return User.findById(userId);
};

const updateById = async (userId, updateData) => {
  return User.updateOne({ _id: userId }, updateData);
};

module.exports = {
  findByIdActive,
  findById,
  updateById,
};
