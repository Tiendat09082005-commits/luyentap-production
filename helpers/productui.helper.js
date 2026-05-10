
function buildCategoryBrandMap(categories = []) {
  const categoryMap = {};
  const rootCategories = [];
  const brandCategoriesByRoot = {};

  categories.forEach((category) => {
    categoryMap[String(category._id)] = category;
  });

  categories.forEach((category) => {
    if (!category.parent_id) {
      rootCategories.push(category);
      brandCategoriesByRoot[String(category._id)] = [];
    }
  });

  categories.forEach((category) => {
    if (!category.parent_id) return;

    const parent = categoryMap[String(category.parent_id)];
    if (!parent || !parent.parent_id) return;

    const grandParent = categoryMap[String(parent.parent_id)];
    if (!grandParent || grandParent.parent_id) return;

    const rootId = String(grandParent._id);
    if (!brandCategoriesByRoot[rootId]) {
      brandCategoriesByRoot[rootId] = [];
    }

    brandCategoriesByRoot[rootId].push({
      _id: category._id,
      title: category.title,
      parent_id: category.parent_id,
      root_id: grandParent._id,
    });
  });

  Object.keys(brandCategoriesByRoot).forEach((rootId) => {
    brandCategoriesByRoot[rootId].sort((a, b) =>
      String(a.title || "").localeCompare(String(b.title || ""), "vi")
    );
  });

  rootCategories.sort((a, b) =>
    String(a.title || "").localeCompare(String(b.title || ""), "vi")
  );

  return { rootCategories, brandCategoriesByRoot };
}


function getVisualAttrCode(productData) {
  const visualAttr = productData.attributes?.find((a) => a.affectsImage);
  return visualAttr ? visualAttr.code : null;
}


function applyVariantImageFallbacks(productData) {
  const visualAttrCode = getVisualAttrCode(productData);

  if (
    visualAttrCode &&
    productData.variantImages &&
    productData.variantImages[visualAttrCode]
  ) {
    const imagesMap = productData.variantImages[visualAttrCode];
    for (const valKey in imagesMap) {
      if (!productData.thumbnail && imagesMap[valKey].thumb) {
        productData.thumbnail = imagesMap[valKey].thumb;
      }
      if (imagesMap[valKey].gallery && Array.isArray(imagesMap[valKey].gallery)) {
        productData.images.push(...imagesMap[valKey].gallery);
      }
    }
  }

  productData.images = [...new Set(productData.images.filter((img) => img))];
  return visualAttrCode;
}

/**
 * Build danh sách variant docs để insert vào DB
 * @param {object[]} variantData
 * @param {string|object} productId
 * @param {object} productData
 * @param {string|null} visualAttrCode
 * @param {object} extraFields - Các field bổ sung (vd: { deleted: false })
 */
function buildVariantDocs(variantData, productId, productData, visualAttrCode, extraFields = {}) {
  return variantData.map((variant) => {
    let finalThumb = variant.thumbnail;

    if (!finalThumb && visualAttrCode && productData.variantImages) {
      const val = variant.attributes && variant.attributes[visualAttrCode];
      if (
        val &&
        productData.variantImages[visualAttrCode] &&
        productData.variantImages[visualAttrCode][val]
      ) {
        finalThumb = productData.variantImages[visualAttrCode][val].thumb;
      }
    }

    return {
      ...variant,
      ...extraFields,
      product_id: productId,
      thumbnail: finalThumb || productData.thumbnail || "",
    };
  });
}


function enrichProductList(products, brandCategories, variantStats) {
  const brandMap = {};
  brandCategories.forEach((brand) => {
    brandMap[brand._id.toString()] = brand;
  });

  const variantMap = {};
  variantStats.forEach((item) => {
    variantMap[item._id.toString()] = item;
  });

  for (const product of products) {
    const brand = brandMap[product.brand_id?.toString()];
    if (brand) product.nameBrand = brand.title;

    const stats = variantMap[product._id.toString()];
    product.minPrice = stats?.minPrice || 0;
    product.maxPrice = stats?.maxPrice || 0;
    product.totalStock = stats?.totalStock || 0;
    product.variantCount = stats?.variantCount || 0;

    if (!product.thumbnail && stats?.thumbs) {
      const validThumb = stats.thumbs.find((t) => t);
      if (validThumb) product.thumbnail = validThumb;
    }
  }
}

module.exports = {
  buildCategoryBrandMap,
  getVisualAttrCode,
  applyVariantImageFallbacks,
  buildVariantDocs,
  enrichProductList,
};