const mongoose = require("mongoose");
const Product = require("../../models/products.model");
const ProductVariant = require("../../models/productVariant.model");
const ProductCategory = require("../../models/products-category.model");

const getFlashSaleVariants = async (productIds) => {
  if (!productIds || productIds.length === 0) return [];
  const objectIds = productIds.map(id => new mongoose.Types.ObjectId(id.toString()));

  return ProductVariant.aggregate([
    {
      $match: {
        deleted: false,
        status: "active",
        product_id: { $in: objectIds },
        discount: { $gt: 0 },
      },
    },
    { $sort: { discount: -1 } },
    {
      $group: {
        _id: "$product_id",
        discount: { $first: "$discount" },
        price: { $first: "$price" },
        thumbnail: { $first: "$thumbnail" },
      },
    },
    { $sort: { discount: -1 } },
    { $limit: 4 },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
    {
      $match: {
        "product.deleted": false,
        "product.status": "active",
      },
    },
  ]);
};

const getFeaturedProducts = async () => {
  return Product.aggregate([
    {
      $match: {
        deleted: false,
        status: "active",
      },
    },
    { $sort: { createdAt: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "product_variants",
        localField: "_id",
        foreignField: "product_id",
        as: "variants",
      },
    },
  ]);
};

const getHomeCategories = async () => {
  return ProductCategory.find({
    deleted: false,
    status: "active",
    parent_id: null,
  })
    .sort({ position: 1, createdAt: 1 })
    .limit(6)
    .lean();
};

const getCategoryProductCounts = async () => {
  return Product.aggregate([
    {
      $match: {
        deleted: false,
        status: "active",
        category_id: { $ne: null },
      },
    },
    {
      $group: {
        _id: "$category_id",
        total: { $sum: 1 },
      },
    },
  ]);
};

module.exports = {
  getFlashSaleVariants,
  getFeaturedProducts,
  getHomeCategories,
  getCategoryProductCounts,
};
