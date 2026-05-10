const ProductCategory = require("../../models/products-category.model");
const { buildCategoryMeta } = require("../../helpers/product-category.meta");
const { buildLevelResolver } = require("../../helpers/product-category.level");
const { normalizeText } = require("../../helpers/product-category.normalize");

async function validateCategoryPayload({ id = "", title, parentId }) {
  const normalizedTitle = normalizeText(title);

  if (!normalizedTitle) {
    return {
      error: {
        status: 400,
        payload: { success: false, message: "Thieu title" },
      },
    };
  }

  const { categoryMap } = await buildCategoryMeta();

  const resolveLevel = buildLevelResolver(categoryMap);

  let level = 1;

  if (parentId) {
    const parent = categoryMap[String(parentId)];
    if (!parent) {
      return {
        error: {
          status: 400,
          payload: { success: false, message: "Danh muc cha khong hop le" },
        },
      };
    }

    // Issue 9 Fix: kiểm tra circular dependency
    // Nếu đang edit (có id), parentId không được là chính nó hoặc con cháu của nó
    if (id) {
      const idStr = String(id);

      // parentId không được là chính id đang edit
      if (String(parentId) === idStr) {
        return {
          error: {
            status: 400,
            payload: {
              success: false,
              message: "Danh muc khong the la cha cua chinh no",
            },
          },
        };
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
        return {
          error: {
            status: 400,
            payload: {
              success: false,
              message: "Khong the dat danh muc cha la mot danh muc con cua no",
            },
          },
        };
      }
    }

    level = resolveLevel(parent) + 1;

    if (level > 3) {
      return {
        error: {
          status: 400,
          payload: {
            success: false,
            message: "Chi ho tro toi da 3 cap danh muc",
          },
        },
      };
    }
  }

  return {
    normalizedTitle,
    level,
  };
}

module.exports = { validateCategoryPayload };