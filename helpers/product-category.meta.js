const ProductCategory = require("../models/products-category.model");
const { normalizeCategoryIcon } = require("../config/category-icons");

async function buildCategoryMeta() {
  const categories = await ProductCategory.find({
    deleted: false,
  })
    .sort({ position: "asc" })
    .lean();

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