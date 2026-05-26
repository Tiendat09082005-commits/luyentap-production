const { buildCategoryMeta } = require("../../helpers/product-category.meta");
const { buildLevelResolver } = require("../../helpers/product-category.level");
const { normalizeText } = require("../../helpers/product-category.normalize");
const AppError = require("../../utils/AppError");
const ERROR_CODE = require("../../constants/error-code");

async function validateCategoryPayload({ id = "", title, parentId }) {
  const normalizedTitle = normalizeText(title);

  if (!normalizedTitle) {
    throw new AppError(400, ERROR_CODE.CATEGORY_MISSING_TITLE, "Tên danh mục không được để trống");
  }

  const { categoryMap } = await buildCategoryMeta();

  const resolveLevel = buildLevelResolver(categoryMap);

  let level = 1;

  if (parentId) {
    const parent = categoryMap[String(parentId)];
    if (!parent) {
      throw new AppError(400, ERROR_CODE.CATEGORY_INVALID_PARENT, "Danh mục cha không hợp lệ");
    }

    // Issue 9 Fix: kiểm tra circular dependency
    // Nếu đang edit (có id), parentId không được là chính nó hoặc con cháu của nó
    if (id) {
      const idStr = String(id);

      // parentId không được là chính id đang edit
      if (String(parentId) === idStr) {
        throw new AppError(400, ERROR_CODE.CATEGORY_CIRCULAR_DEPENDENCY, "Danh mục không thể là cha của chính nó");
      }

      // BFS: tìm tất cả hậu duệ của category đang edit
      const descendants = new Set();
      const queue = [idStr];
      while (queue.length > 0) {
        const currentId = queue.shift();
        Object.values(categoryMap).forEach((cat) => {
          const catParentId = cat.parent_id ? String(cat.parent_id) : null;
          if (catParentId === currentId) {
            const catIdStr = String(cat._id);
            if (!descendants.has(catIdStr)) {
              descendants.add(catIdStr);
              queue.push(catIdStr);
            }
          }
        });
      }

      if (descendants.has(String(parentId))) {
        throw new AppError(400, ERROR_CODE.CATEGORY_CIRCULAR_DEPENDENCY, "Không thể đặt danh mục cha là một danh mục con của nó");
      }
    }

    level = resolveLevel(parent) + 1;

    if (level > 3) {
      throw new AppError(400, ERROR_CODE.CATEGORY_EXCEED_LEVEL_LIMIT, "Chỉ hỗ trợ tối đa 3 cấp danh mục");
    }
  }

  return {
    normalizedTitle,
    level,
  };
}

const mongoose = require("mongoose");

const validateCreateCategoryRequest = (body) => {
  const errors = [];
  if (!body.title) {
    errors.push("Tiêu đề không được để trống");
  }
  return errors;
};

const validateEditCategoryRequest = (params, body) => {
  const errors = [];
  if (!params.id) {
    errors.push("Thiếu ID danh mục");
  } else if (!mongoose.Types.ObjectId.isValid(params.id)) {
    errors.push("ID danh mục không hợp lệ");
  }

  if (!body.title) {
    errors.push("Tiêu đề không được để trống");
  }
  return errors;
};

module.exports = { 
  validateCategoryPayload,
  validateCreateCategoryRequest,
  validateEditCategoryRequest
};