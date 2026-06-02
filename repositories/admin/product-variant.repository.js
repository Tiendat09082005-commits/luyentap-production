const ProductVariant = require("../../models/productVariant.model");

const getVariantStatsByProductIds = async (productIds) => {
  return ProductVariant.aggregate([
    { $match: { product_id: { $in: productIds }, deleted: false, status: "active" } },
    {
      $group: {
        _id: "$product_id",
        minPrice: { $min: "$price" },
        maxPrice: { $max: "$price" },
        totalStock: { $sum: "$stock" },
        variantCount: { $sum: 1 },
        thumbs: { $push: "$thumbnail" },
      },
    },
  ]);
};

const insertMany = async (variantDocs, session) => {
  return ProductVariant.insertMany(variantDocs, { session });
};

const deleteByProductId = async (productId, session) => {
  return ProductVariant.deleteMany({ product_id: productId }).session(session);
};

const softDeleteByProductIds = async (productIds) => {
  return ProductVariant.updateMany({ product_id: { $in: productIds } }, { deleted: true });
};

const softDeleteByProductId = async (productId) => {
  return ProductVariant.updateMany({ product_id: productId }, { deleted: true });
};

const hardDeleteByProductId = async (productId) => {
  return ProductVariant.deleteMany({ product_id: productId });
};

const findByProductIdActive = async (productId) => {
  return ProductVariant.find({ product_id: productId, deleted: false }).lean();
};

const restoreByProductId = async (productId) => {
  return ProductVariant.updateMany({ product_id: productId }, { deleted: false });
};

module.exports = {
  getVariantStatsByProductIds,
  insertMany,
  deleteByProductId,
  softDeleteByProductIds,
  softDeleteByProductId,
  hardDeleteByProductId,
  findByProductIdActive,
  restoreByProductId,
};
