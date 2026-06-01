const mongoose = require("mongoose");
const cacheService = require("../../services/cache.service");
const productRepo = require("../../repositories/admin/product.repository");
const variantRepo = require("../../repositories/admin/product-variant.repository");
const productCategoryRepo = require("../../repositories/admin/product-category.repository");
const attributeRepo = require("../../repositories/admin/attribute.repository");

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
  return productRepo.getStats();
}

/**
 * Lấy danh sách sản phẩm kèm brand name + variant stats
 */
async function getProductList(find, pagination) {
  const products = await productRepo.getList(find, pagination);

  const productIds = products.map((p) => p._id);
  const brandIds = products.map((p) => p.brand_id);

  const [brandCategories, variantStats] = await Promise.all([
    productCategoryRepo.findByIds(brandIds, "title"),
    variantRepo.getVariantStatsByProductIds(productIds),
  ]);

  enrichProductList(products, brandCategories, variantStats);
  return products;
}

/**
 * Tự động fix các sản phẩm có position = 0
 */
async function fixZeroPositions() {
  const count = await productRepo.countZeroPositions();
  if (count === 0) return;

  const docs = await productRepo.getZeroPositionDocs();
  if (docs.length === 0) return;

  const bulkOps = docs.map((doc, index) => ({
    updateOne: {
      filter: { _id: doc._id },
      update: { $set: { position: index + 1 } },
    },
  }));

  const result = await productRepo.bulkWrite(bulkOps);
  console.log(`Đã cập nhật ${result.modifiedCount} sản phẩm có position = 0`);
}

/**
 * Lấy dữ liệu cho form create/edit (categories + attributes)
 */
async function getFormData() {
  const [categories, attributes] = await Promise.all([
    productCategoryRepo.findAllActive(),
    attributeRepo.find({ deleted: false }),
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
    const [savedProduct] = await productRepo.createProduct(productData, session);

    // Lưu variants
    const variantDocs = buildVariantDocs(variantData, savedProduct._id, productData, visualAttrCode);
    if (variantDocs.length > 0) {
      await variantRepo.insertMany(variantDocs, session);
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
    await productRepo.updateProduct(id, productData, session);

    // Thay thế toàn bộ variants
    await variantRepo.deleteByProductId(id, session);
    const variantDocs = buildVariantDocs(variantData, id, productData, visualAttrCode);
    if (variantDocs.length > 0) {
      await variantRepo.insertMany(variantDocs, session);
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
  await productRepo.updateStatus(id, status);
  await invalidateCache();
}

async function softDelete(id) {
  // Cascade: soft-delete tất cả variants liên quan
  await Promise.all([
    productRepo.softDeleteProduct(id),
    variantRepo.softDeleteByProductId(id),
  ]);
  await invalidateCache();
}

async function changeMulti(type, ids) {
  switch (type) {
    case "active":
      await productRepo.updateManyStatus(ids, "active");
      break;
    case "inactive":
      await productRepo.updateManyStatus(ids, "inactive");
      break;
    case "change-position":
      for (const item of ids) {
        const [id, pos] = item.split("-");
        await productRepo.updatePosition(id, parseInt(pos));
      }
      break;
    case "delete-all":
      await Promise.all([
        productRepo.softDeleteMany(ids),
        variantRepo.softDeleteByProductIds(ids),
      ]);
      break;
  }
  await invalidateCache();
}

// ─── Trash

async function restoreProduct(id) {
  await Promise.all([
    productRepo.restoreProduct(id),
    variantRepo.restoreByProductId(id),
  ]);
  await invalidateCache();
}

async function hardDeleteProduct(id) {
  // Cascade: xóa vĩnh viễn tất cả variants trước, rồi xóa product
  await Promise.all([
    variantRepo.hardDeleteByProductId(id),
    productRepo.hardDeleteProduct(id),
  ]);
  await invalidateCache();
}

async function getTrashList(find, pagination) {
  return productRepo.getTrashList(find, pagination);
}

// ─── Detail

async function getProductDetail(id) {
  const [product, variants] = await Promise.all([
    productRepo.findByIdWithRelations(id),
    variantRepo.findByProductIdActive(id),
  ]);

  if (!product) return { product: null, variants: [] };

  if (!product.thumbnail && variants.length > 0) {
    const vThumb = variants.find((v) => v.thumbnail);
    if (vThumb) product.thumbnail = vThumb.thumbnail;
  }

  return { product, variants };
}

async function getProductForEdit(id) {
  return productRepo.findByIdActive(id);
}

async function getVariantsForEdit(id) {
  return variantRepo.findByProductIdActive(id);
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