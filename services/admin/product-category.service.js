const ProductCategory = require("../../models/products-category.model");
const { buildCategoryMeta } = require("../../helpers/product-category.meta");
const { buildLevelResolver } = require("../../helpers/product-category.level");
const {
  normalizeCategoryIcon,
  DEFAULT_CATEGORY_ICON,
} = require("../../config/category-icons");
const { normalizeText } = require("../../helpers/product-category.normalize");
const { validateCategoryPayload } = require("../../validate/admin/product-category.validate");


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

  if (validation.error) return validation;

  const isRootCategory = validation.level === 1;
  const nextThumbnail = normalizeText(thumbnail);

  // business rule
  if (!isRootCategory && !nextThumbnail) {
    return {
      error: {
        status: 400,
        payload: {
          success: false,
          message: "Danh muc cap 2-3 bat buoc co anh",
        },
      },
    };
  }

  // Issue 6 Fix: kiểm tra slug trùng trước khi tạo
  const normalizedSlug = normalizeText(slug);
  if (normalizedSlug) {
    const slugExists = await ProductCategory.exists({
      slug: normalizedSlug,
      deleted: false,
    });

    if (slugExists) {
      return {
        error: {
          status: 400,
          payload: { success: false, message: "Slug nay da ton tai, vui long chon slug khac" },
        },
      };
    }
  }

  // Issue 10 Fix: tự động tính position = max trong cùng scope parent + 1
  const siblingPositions = await ProductCategory.find({
    parent_id: parent_id || null,
    deleted: false,
  })
    .select("position")
    .lean();

  const maxPosition = siblingPositions.reduce(
    (max, cat) => Math.max(max, cat.position || 0),
    0
  );
  const nextPosition = maxPosition + 1;

  const newCategory = await ProductCategory.create({
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
    return {
      error: {
        status: 400,
        payload: { success: false, message: "Thieu id danh muc" },
      },
    };
  }

  const existing = await ProductCategory.findById(id).lean();

  if (!existing) {
    return {
      error: {
        status: 404,
        payload: { success: false, message: "Khong tim thay danh muc" },
      },
    };
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

  if (validation.error) return validation;

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
    return {
      error: {
        status: 400,
        payload: {
          success: false,
          message: "Danh muc cap 2-3 bat buoc co anh",
        },
      },
    };
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
    const slugExists = await ProductCategory.exists({
      slug: normalizedSlug,
      deleted: false,
      _id: { $ne: id },
    });

    if (slugExists) {
      return {
        error: {
          status: 400,
          payload: { success: false, message: "Slug nay da ton tai, vui long chon slug khac" },
        },
      };
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

  const updated = await ProductCategory.findByIdAndUpdate(
    id,
    updateData,
    { new: true }
  );

  return {
    data: updated,
  };
}

async function deleteCategory(id) {
  if (!id) {
    return {
      error: {
        status: 400,
        payload: { success: false, message: "Thieu id danh muc" },
      },
    };
  }

  // check tồn tại
  const existing = await ProductCategory.findOne({
    _id: id,
    deleted: false,
  }).lean();

  if (!existing) {
    return {
      error: {
        status: 404,
        payload: { success: false, message: "Khong tim thay danh muc" },
      },
    };
  }

  //  check có category con không
  const hasChild = await ProductCategory.exists({
    parent_id: id,
    deleted: false,
  });

  if (hasChild) {
    return {
      error: {
        status: 400,
        payload: {
          success: false,
          message: "Khong the xoa danh muc co danh muc con",
        },
      },
    };
  }

  //  soft delete
  await ProductCategory.updateOne(
    { _id: id },
    { deleted: true }
  );

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