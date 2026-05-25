const mongoose = require("mongoose");
const Product = require("../../models/products.model");
const ProductVariant = require("../../models/productVariant.model");
const ProductCategory = require("../../models/products-category.model.js");
const Attribute = require("../../models/attribute.model");
const cacheService = require("../../services/cache.service");
const { normalizeProductPayload } = require("../../helpers/product.helper");
const {
  applyVariantImageFallbacks,
  buildVariantDocs,
  enrichProductList,
} = require("../../helpers/productui.helper");
const {
  validateSkuUniquenessInRequest,
  validateSkuUniquenessInDB,
  extractSkuList,
} = require("../../validate/admin/product.validate.js");

// ─── Cache 

async function invalidateCache() {
  await cacheService.invalidateSearchModel("Product");
}

// ─── Query helpers 


/**
 * Thống kê tổng quan: số lượng sản phẩm theo trạng thái + tổng tồn kho
 */
async function getProductStats() {
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
}

/**
 * Lấy danh sách sản phẩm kèm brand name + variant stats
 */
async function getProductList(find, pagination) {
  const products = await Product.find(find)
    .select("title brand_id thumbnail status rating createdAt position")
    .skip(pagination.skip)
    .limit(pagination.limit)
    .sort({ position: 1 })
    .lean();

  const productIds = products.map((p) => p._id);
  const brandIds = products.map((p) => p.brand_id);

  const [brandCategories, variantStats] = await Promise.all([
    ProductCategory.find({ _id: { $in: brandIds }, deleted: false })
      .select("title")
      .lean(),

    ProductVariant.aggregate([
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
    ]),
  ]);

  enrichProductList(products, brandCategories, variantStats);
  return products;
}

/**
 * Tự động fix các sản phẩm có position = 0
 */
async function fixZeroPositions() {
  const count = await Product.countDocuments({ position: 0 });
  if (count === 0) return;

  const docs = await Product.find({ position: 0 }).sort({ _id: 1 }).lean();
  if (docs.length === 0) return;

  const bulkOps = docs.map((doc, index) => ({
    updateOne: {
      filter: { _id: doc._id },
      update: { $set: { position: index + 1 } },
    },
  }));

  const result = await Product.bulkWrite(bulkOps);
  console.log(`Đã cập nhật ${result.modifiedCount} sản phẩm có position = 0`);
}

/**
 * Lấy dữ liệu cho form create/edit (categories + attributes)
 */
async function getFormData() {
  const [categories, attributes] = await Promise.all([
    ProductCategory.find({ deleted: false, status: "active" }).lean(),
    Attribute.find({ deleted: false }).lean(),
  ]);
  return { categories, attributes };
}

// ─── Create 

/**
 * Tạo mới product + variants trong một transaction
 * @returns {{ success: boolean, error?: string }}
 */
async function createProduct(body) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { productData, variantData } = normalizeProductPayload(body);

    // Validate SKU
    const inRequestCheck = validateSkuUniquenessInRequest(variantData);
    if (!inRequestCheck.valid) {
      await session.abortTransaction();
      session.endSession();
      return { success: false, error: inRequestCheck.message };
    }

    const skuList = extractSkuList(variantData);
    const inDbCheck = await validateSkuUniquenessInDB(skuList, { session });
    if (!inDbCheck.valid) {
      await session.abortTransaction();
      session.endSession();
      return { success: false, error: inDbCheck.message };
    }

    // Xử lý ảnh
    const visualAttrCode = applyVariantImageFallbacks(productData);

    // Lưu product
    const [savedProduct] = await Product.create([productData], { session });

    // Lưu variants
    const variantDocs = buildVariantDocs(variantData, savedProduct._id, productData, visualAttrCode);
    if (variantDocs.length > 0) {
      await ProductVariant.insertMany(variantDocs, { session });
    }

    await session.commitTransaction();
    session.endSession();
    await invalidateCache();

    return { success: true };
  } catch (error) {
    try { await session.abortTransaction(); } catch (_) {}
    session.endSession();
    console.error("CREATE PRODUCT ERROR:", error);
    return { success: false, error: "Đã có lỗi xảy ra khi tạo sản phẩm." };
  }
}

//  Update 

/**
 * Cập nhật product + variants trong một transaction
 * @returns {{ success: boolean, error?: string }}
 */
async function updateProduct(id, body) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { productData, variantData } = normalizeProductPayload(body);

    // Validate SKU
    const inRequestCheck = validateSkuUniquenessInRequest(variantData);
    if (!inRequestCheck.valid) {
      await session.abortTransaction();
      session.endSession();
      return { success: false, error: inRequestCheck.message };
    }

    const skuList = extractSkuList(variantData);
    const inDbCheck = await validateSkuUniquenessInDB(skuList, {
      excludeProductId: id,
      session,
    });
    if (!inDbCheck.valid) {
      await session.abortTransaction();
      session.endSession();
      return { success: false, error: inDbCheck.message };
    }

    // Xử lý ảnh
    const visualAttrCode = applyVariantImageFallbacks(productData);

    // Cập nhật product
    await Product.updateOne({ _id: id }, { $set: productData }).session(session);

    // Thay thế toàn bộ variants
    await ProductVariant.deleteMany({ product_id: id }).session(session);
    const variantDocs = buildVariantDocs(variantData, id, productData, visualAttrCode);
    if (variantDocs.length > 0) {
      await ProductVariant.insertMany(variantDocs, { session });
    }

    await session.commitTransaction();
    session.endSession();
    await invalidateCache();

    return { success: true };
  } catch (error) {
    try { await session.abortTransaction(); } catch (_) {}
    session.endSession();
    console.error("UPDATE PRODUCT ERROR:", error);
    return { success: false, error: "Đã có lỗi xảy ra khi cập nhật sản phẩm." };
  }
}

//  Status / Bulk actions 

async function changeStatus(id, status) {
  await Product.updateOne({ _id: id }, { status });
  await invalidateCache();
}

async function softDelete(id) {
  // Cascade: soft-delete tất cả variants liên quan
  await Promise.all([
    Product.updateOne({ _id: id }, { deleted: true }),
    ProductVariant.updateMany({ product_id: id }, { deleted: true }),
  ]);
  await invalidateCache();
}

async function changeMulti(type, ids) {
  switch (type) {
    case "active":
      await Product.updateMany({ _id: { $in: ids } }, { status: "active" });
      break;
    case "inactive":
      await Product.updateMany({ _id: { $in: ids } }, { status: "inactive" });
      break;
    case "change-position":
      for (const item of ids) {
        const [id, pos] = item.split("-");
        await Product.updateOne({ _id: id }, { position: parseInt(pos) });
      }
      break;
    case "delete-all":
      await Product.updateMany({ _id: { $in: ids } }, { deleted: true });
      break;
  }
  await invalidateCache();
}

// ─── Trash

async function restoreProduct(id) {
  await Product.updateOne({ _id: id }, { deleted: false });
  await invalidateCache();
}

async function hardDeleteProduct(id) {
  // Cascade: xóa vĩnh viễn tất cả variants trước, rồi xóa product
  await Promise.all([
    ProductVariant.deleteMany({ product_id: id }),
    Product.deleteOne({ _id: id }),
  ]);
  await invalidateCache();
}

async function getTrashList(find, pagination) {
  return Product.find(find)
    .skip(pagination.skip)
    .limit(pagination.limit)
    .lean();
}

// ─── Detail

async function getProductDetail(id) {
  const [product, variants] = await Promise.all([
    Product.findOne({ _id: id })
      .populate("category_id", "title")
      .populate("brand_id", "title")
      .lean(),
    ProductVariant.find({ product_id: id, deleted: false }).lean(),
  ]);

  if (!product) return { product: null, variants: [] };

  if (!product.thumbnail && variants.length > 0) {
    const vThumb = variants.find((v) => v.thumbnail);
    if (vThumb) product.thumbnail = vThumb.thumbnail;
  }

  return { product, variants };
}

async function getProductForEdit(id) {
  return Product.findOne({ _id: id, deleted: false }).lean();
}

async function getVariantsForEdit(id) {
  return ProductVariant.find({ product_id: id, deleted: false }).lean();
}

module.exports = {
  getProductStats,
  getProductList,
  fixZeroPositions,
  getFormData,
  createProduct,
  updateProduct,
  changeStatus,
  softDelete,
  changeMulti,
  restoreProduct,
  hardDeleteProduct,
  getTrashList,
  getProductDetail,
  getProductForEdit,
  getVariantsForEdit,
};