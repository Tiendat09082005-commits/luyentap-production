const productCategoryRepository = require("../../repositories/admin/product-category.reponsitory");
const { buildCategoryMeta } = require("../../helpers/product-category.meta");
const { buildLevelResolver } = require("../../helpers/product-category.level");
const {
  normalizeCategoryIcon,
  DEFAULT_CATEGORY_ICON,
} = require("../../config/category-icons");
const { normalizeText } = require("../../helpers/product-category.normalize");
const { validateCategoryPayload } = require("../../validate/admin/product-category.validate");
const AppError = require("../../utils/AppError");
const ERROR_CODE = require("../../constants/error-code");


async function getCategoryTreeWithStats(treeHelper) {
  const { categories, categoryMap } = await buildCategoryMeta();

  const resolveLevel = buildLevelResolver(categoryMap);

  const stats = {
    total: categories.length,
    active: 0,
    level1: 0,
    level2: 0,
    level3: 0,
  };

  const enriched = categories.map((category) => {
    const level = resolveLevel(category);

    if (category.status === "active") stats.active++;

    if (level === 1) stats.level1++;
    else if (level === 2) stats.level2++;
    else if (level === 3) stats.level3++;

    return {
      ...category,
      level,
    };
  });

  const tree = treeHelper.tree(enriched);

  return {
    tree,
    stats,
  };
}

async function createCategory(payload) {
  const { title, slug, parent_id, status, icon, thumbnail } = payload;

  const validation = await validateCategoryPayload({
    title,
    parentId: parent_id,
  });

  const isRootCategory = validation.level === 1;
  const nextThumbnail = normalizeText(thumbnail);

  // business rule
  if (!isRootCategory && !nextThumbnail) {
    throw new AppError(400, ERROR_CODE.CATEGORY_REQUIRED_IMAGE, "Danh mục cấp 2-3 bắt buộc có ảnh");
  }

  // Issue 6 Fix: kiểm tra slug trùng trước khi tạo
  const normalizedSlug = normalizeText(slug);
  if (normalizedSlug) {
    const slugExists = await productCategoryRepository.existsBySlug(normalizedSlug);

    if (slugExists) {
      throw new AppError(400, ERROR_CODE.CATEGORY_DUPLICATE_SLUG, "Slug này đã tồn tại, vui lòng chọn slug khác");
    }
  }

  // Issue 10 Fix: tự động tính position = max trong cùng scope parent + 1
  const siblingPositions = await productCategoryRepository.findSiblingPositions(parent_id);

  const maxPosition = siblingPositions.reduce(
    (max, cat) => Math.max(max, cat.position || 0),
    0
  );
  const nextPosition = maxPosition + 1;

  const newCategory = await productCategoryRepository.create({
    title: validation.normalizedTitle,
    slug: normalizedSlug || slug,
    parent_id: parent_id || null,
    status,
    icon: isRootCategory
      ? normalizeCategoryIcon(icon)
      : DEFAULT_CATEGORY_ICON,
    thumbnail: isRootCategory ? "" : nextThumbnail,
    position: nextPosition,
    deleted: false,
  });

  return {
    data: newCategory,
  };
}


async function updateCategory(id, payload) {
  if (!id) {
    throw new AppError(400, ERROR_CODE.CATEGORY_MISSING_ID, "Thiếu id danh mục");
  }

  const existing = await productCategoryRepository.findById(id);

  if (!existing) {
    throw new AppError(404, ERROR_CODE.CATEGORY_NOT_FOUND, "Không tìm thấy danh mục");
  }

  const {
    title,
    slug,
    parent_id,
    status,
    icon,
    thumbnail,
    thumbnailExisting,
  } = payload;

  const validation = await validateCategoryPayload({
    id,
    title,
    parentId: parent_id,
  });

  const isRoot = validation.level === 1;

  // xử lý thumbnail (clean hơn)
  const nextThumbnail = [
    thumbnail,
    thumbnailExisting,
    existing.thumbnail,
  ]
    .map(normalizeText)
    .find(Boolean);

  if (!isRoot && !nextThumbnail) {
    throw new AppError(400, ERROR_CODE.CATEGORY_REQUIRED_IMAGE, "Danh mục cấp 2-3 bắt buộc có ảnh");
  }

  // xử lý icon rõ ràng hơn
  let finalIcon;
  if (isRoot) {
    finalIcon = normalizeCategoryIcon(icon);
  } else {
    finalIcon = normalizeCategoryIcon(existing.icon);
  }

  // Issue 7 Fix: kiểm tra slug trùng khi update (loại trừ chính nó)
  const normalizedSlug = normalizeText(slug);
  if (normalizedSlug) {
    const slugExists = await productCategoryRepository.existsBySlug(normalizedSlug, id);

    if (slugExists) {
      throw new AppError(400, ERROR_CODE.CATEGORY_DUPLICATE_SLUG, "Slug này đã tồn tại, vui lòng chọn slug khác");
    }
  }

  const updateData = {
    title: validation.normalizedTitle,
    slug: normalizedSlug,
    parent_id: parent_id || null,
    status: status || "active",
    icon: finalIcon,
    thumbnail: isRoot ? "" : nextThumbnail,
  };

  const updated = await productCategoryRepository.update(id, updateData);

  return {
    data: updated,
  };
}

async function deleteCategory(id) {
  if (!id) {
    throw new AppError(400, ERROR_CODE.CATEGORY_MISSING_ID, "Thiếu id danh mục");
  }

  // check tồn tại
  const existing = await productCategoryRepository.findOneActive(id);

  if (!existing) {
    throw new AppError(404, ERROR_CODE.CATEGORY_NOT_FOUND, "Không tìm thấy danh mục");
  }

  //  check có category con không
  const hasChild = await productCategoryRepository.hasChildren(id);

  if (hasChild) {
    throw new AppError(400, ERROR_CODE.CATEGORY_HAS_CHILDREN, "Không thể xóa danh mục có danh mục con");
  }

  //  soft delete
  await productCategoryRepository.softDelete(id);

  return {
    data: true,
  };
}
module.exports = {
  getCategoryTreeWithStats,
  createCategory,
  updateCategory,
  deleteCategory
};