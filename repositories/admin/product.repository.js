const Product = require("../../models/products.model");

const findProductsByIds = async (productIds, selectFields = "") => {
  const query = Product.find({ _id: { $in: productIds } });
  if (selectFields) {
    query.select(selectFields);
  }
  return await query.lean();
};

const getStats = async () => {
  const [productCounts, stockStats] = await Promise.all([
    Product.aggregate([
      { $match: { deleted: false } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
          inactive: { $sum: { $cond: [{ $eq: ["$status", "inactive"] }, 1, 0] } },
        },
      },
    ]),
    Product.aggregate([
      { $match: { deleted: false } },
      {
        $lookup: {
          from: "product_variants",
          localField: "_id",
          foreignField: "product_id",
          pipeline: [{ $match: { deleted: false, status: "active" } }],
          as: "variants",
        },
      },
      { $project: { totalStock: { $sum: "$variants.stock" } } },
      {
        $group: {
          _id: null,
          totalStockAll: { $sum: "$totalStock" },
          lowStockCount: { $sum: { $cond: [{ $lte: ["$totalStock", 10] }, 1, 0] } },
        },
      },
    ]),
  ]);

  return {
    totalProduct: productCounts[0]?.total || 0,
    activeProduct: productCounts[0]?.active || 0,
    inactiveProduct: productCounts[0]?.inactive || 0,
    totalStock: stockStats[0]?.totalStockAll || 0,
    lowStock: stockStats[0]?.lowStockCount || 0,
  };
};

const getList = async (find, pagination) => {
  return Product.find(find)
    .select("title brand_id thumbnail status rating createdAt position")
    .skip(pagination.skip)
    .limit(pagination.limit)
    .sort({ position: 1 })
    .lean();
};

const countZeroPositions = async () => {
  return Product.countDocuments({ position: 0 });
};

const getZeroPositionDocs = async () => {
  return Product.find({ position: 0 }).sort({ _id: 1 }).lean();
};

const bulkWrite = async (bulkOps) => {
  return Product.bulkWrite(bulkOps);
};

const createProduct = async (productData, session) => {
  return Product.create([productData], { session });
};

const updateProduct = async (id, productData, session) => {
  return Product.updateOne({ _id: id }, { $set: productData }).session(session);
};

const updateStatus = async (id, status) => {
  return Product.updateOne({ _id: id }, { status });
};

const updateManyStatus = async (ids, status) => {
  return Product.updateMany({ _id: { $in: ids } }, { status });
};

const updatePosition = async (id, position) => {
  return Product.updateOne({ _id: id }, { position });
};

const softDeleteMany = async (ids) => {
  return Product.updateMany({ _id: { $in: ids } }, { deleted: true });
};

const softDeleteProduct = async (id) => {
  return Product.updateOne({ _id: id }, { deleted: true });
};

const restoreProduct = async (id) => {
  return Product.updateOne({ _id: id }, { deleted: false });
};

const hardDeleteProduct = async (id) => {
  return Product.deleteOne({ _id: id });
};

const getTrashList = async (find, pagination) => {
  return Product.find(find)
    .skip(pagination.skip)
    .limit(pagination.limit)
    .lean();
};

const findByIdWithRelations = async (id) => {
  return Product.findOne({ _id: id })
    .populate("category_id", "title")
    .populate("brand_id", "title")
    .lean();
};

const findByIdActive = async (id) => {
  return Product.findOne({ _id: id, deleted: false }).lean();
};

const findByBrandIds = async (brandIds) => {
    return Product.find({ brand_id: { $in: brandIds }, deleted: false }).lean();
};


module.exports = {
  findProductsByIds,
  getStats,
  getList,
  countZeroPositions,
  getZeroPositionDocs,
  bulkWrite,
  createProduct,
  updateProduct,
  updateStatus,
  updateManyStatus,
  updatePosition,
  softDeleteMany,
  softDeleteProduct,
  restoreProduct,
  hardDeleteProduct,
  getTrashList,
  findByIdWithRelations,
  findByIdActive,
  findByBrandIds
};
