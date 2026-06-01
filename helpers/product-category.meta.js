const productCategoryRepository = require("../repositories/admin/product-category.repository");
const { normalizeCategoryIcon } = require("../config/category-icons");

async function buildCategoryMeta() {
  const categories = await productCategoryRepository.findAllActive();

  const categoryMap = {};

  categories.forEach((category) => {
    categoryMap[category._id.toString()] = category;
    category.icon = normalizeCategoryIcon(category.icon);
    category.thumbnail = category.thumbnail || "";
  });

  return { categories, categoryMap };
}

module.exports = {
  buildCategoryMeta,
};