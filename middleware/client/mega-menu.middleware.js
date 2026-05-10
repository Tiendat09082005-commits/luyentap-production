const Product = require("../../models/products.model");
const Brand = require("../../models/brand.model");
const ProductCategory = require("../../models/products-category.model");
const ProductVariant = require("../../models/productVariant.model");
const { priceNew } = require("../../helpers/priceNew");
const { normalizeCategoryIcon } = require("../../config/category-icons");

const HOT_PRODUCTS_LIMIT = 20;
const HOT_PRODUCT_POOL_LIMIT = 200;

const fallbackMegaMenu = [
  {
    title: "Dien thoai",
    slug: "dien-thoai",
    icon: "smartphone",
    href: "/products?category=dien-thoai",
    brandGroups: [
      {
        title: "Smartphone",
        items: [
          { title: "iPhone", slug: "iphone", href: "/products?keyword=iPhone" },
          { title: "Samsung", slug: "samsung", href: "/products?keyword=Samsung" },
          { title: "Xiaomi", slug: "xiaomi", href: "/products?keyword=Xiaomi" },
          { title: "OPPO", slug: "oppo", href: "/products?keyword=OPPO" },
        ],
      },
      {
        title: "Gaming Phone",
        items: [
          { title: "ASUS ROG", slug: "asus-rog", href: "/products?keyword=ASUS ROG" },
          { title: "RedMagic", slug: "redmagic", href: "/products?keyword=RedMagic" },
        ],
      },
    ],
    hotProducts: [
      {
        title: "iPhone 15 Pro Max",
        href: "/products",
        thumbnail: "/images/no-image.jpg",
        price: 29990000,
        priceNew: 27990000,
        discount: 7,
      },
      {
        title: "Samsung Galaxy S24 Ultra",
        href: "/products",
        thumbnail: "/images/no-image.jpg",
        price: 26990000,
        priceNew: 24990000,
        discount: 7,
      },
    ],
  },
  {
    title: "Laptop",
    slug: "laptop",
    icon: "laptop",
    href: "/products?category=laptop",
    brandGroups: [
      {
        title: "Ultrabook",
        items: [
          { title: "MacBook", slug: "macbook", href: "/products?keyword=MacBook" },
          { title: "Dell XPS", slug: "dell-xps", href: "/products?keyword=Dell XPS" },
          { title: "HP Spectre", slug: "hp-spectre", href: "/products?keyword=HP Spectre" },
        ],
      },
      {
        title: "Gaming",
        items: [
          { title: "Legion", slug: "legion", href: "/products?keyword=Legion" },
          { title: "ROG", slug: "rog", href: "/products?keyword=ROG" },
          { title: "Acer Nitro", slug: "acer-nitro", href: "/products?keyword=Acer Nitro" },
        ],
      },
    ],
    hotProducts: [
      {
        title: "MacBook Air M3",
        href: "/products",
        thumbnail: "/images/no-image.jpg",
        price: 31990000,
        priceNew: 30990000,
        discount: 3,
      },
      {
        title: "Lenovo Legion 5",
        href: "/products",
        thumbnail: "/images/no-image.jpg",
        price: 28990000,
        priceNew: 25990000,
        discount: 10,
      },
    ],
  },
];

function buildCategoryMaps(categories = []) {
  const categoryMap = new Map();
  const rootCategories = [];
  const childrenByParent = new Map();

  categories.forEach((category) => {
    const id = String(category._id);
    categoryMap.set(id, category);

    if (category.parent_id) {
      const parentId = String(category.parent_id);
      if (!childrenByParent.has(parentId)) {
        childrenByParent.set(parentId, []);
      }
      childrenByParent.get(parentId).push(category);
      return;
    }

    rootCategories.push(category);
  });

  rootCategories.sort((left, right) => {
    if ((left.position || 0) !== (right.position || 0)) {
      return (left.position || 0) - (right.position || 0);
    }
    return new Date(left.createdAt) - new Date(right.createdAt);
  });

  childrenByParent.forEach((items) => {
    items.sort((left, right) => {
      if ((left.position || 0) !== (right.position || 0)) {
        return (left.position || 0) - (right.position || 0);
      }
      return String(left.title || "").localeCompare(String(right.title || ""), "vi");
    });
  });

  return {
    categoryMap,
    childrenByParent,
    rootCategories,
  };
}

function getRootCategoryId(categoryId, categoryMap) {
  let currentId = categoryId ? String(categoryId) : null;

  while (currentId && categoryMap.has(currentId)) {
    const current = categoryMap.get(currentId);
    if (!current.parent_id) {
      return currentId;
    }
    currentId = String(current.parent_id);
  }

  return null;
}

function getRootCategoryIdFromBrand(brandId, brandMapById, brandRootMap) {
  if (!brandId) {
    return null;
  }

  const brand = brandMapById.get(String(brandId));
  if (!brand) {
    return null;
  }

  const slugKey = String(brand.slug || "").trim().toLowerCase();
  const titleKey = String(brand.title || "").trim().toLowerCase();

  return brandRootMap.get(slugKey) || brandRootMap.get(titleKey) || null;
}

function formatProduct(product, variantsByProductId) {
  const variants = variantsByProductId.get(String(product._id)) || [];
  const pricedVariants = variants.map((variant) => ({
    ...variant,
    finalPrice: priceNew(variant.price || 0, variant.discount || 0),
  }));
  pricedVariants.sort((left, right) => left.finalPrice - right.finalPrice);
  const selected = pricedVariants[0] || null;

  return {
    ...product,
    href: `/products/detail/${product._id}`,
    thumbnail: selected?.thumbnail || product.thumbnail || "/images/no-image.jpg",
    price: selected?.price || 0,
    priceNew: selected?.finalPrice || 0,
    discount: selected?.discount || 0,
  };
}

async function buildMegaMenuData() {
  const [categories, brands] = await Promise.all([
    ProductCategory.find({
      deleted: false,
      status: "active",
    }).lean(),
    Brand.find({
      deleted: false,
      status: "active",
    })
      .select("title slug logo")
      .lean(),
  ]);

  if (!categories.length) {
    return fallbackMegaMenu;
  }

  const { categoryMap, childrenByParent, rootCategories } = buildCategoryMaps(categories);
  const brandLogoMap = brands.reduce((accumulator, brand) => {
    const slugKey = String(brand.slug || "").trim().toLowerCase();
    const titleKey = String(brand.title || "").trim().toLowerCase();

    if (slugKey && brand.logo) {
      accumulator.set(slugKey, brand.logo);
    }

    if (titleKey && brand.logo) {
      accumulator.set(titleKey, brand.logo);
    }

    return accumulator;
  }, new Map());
  const brandMapById = brands.reduce((accumulator, brand) => {
    accumulator.set(String(brand._id), brand);
    return accumulator;
  }, new Map());
  const brandRootMap = new Map();

  rootCategories.forEach((rootCategory) => {
    const secondLevelItems = childrenByParent.get(String(rootCategory._id)) || [];

    secondLevelItems.forEach((subCategory) => {
      const thirdLevelItems = childrenByParent.get(String(subCategory._id)) || [];

      thirdLevelItems.forEach((brandCategory) => {
        const slugKey = String(brandCategory.slug || "").trim().toLowerCase();
        const titleKey = String(brandCategory.title || "").trim().toLowerCase();
        const rootId = String(rootCategory._id);

        if (slugKey) {
          brandRootMap.set(slugKey, rootId);
        }

        if (titleKey) {
          brandRootMap.set(titleKey, rootId);
        }
      });
    });
  });

  const latestProducts = await Product.find({
    deleted: false,
    status: "active",
    category_id: { $ne: null },
  })
    .sort({ createdAt: -1 })
    .limit(HOT_PRODUCT_POOL_LIMIT)
    .lean();

  const latestProductIds = latestProducts.map((product) => product._id);
  const variants = latestProductIds.length
    ? await ProductVariant.find({
        product_id: { $in: latestProductIds },
        deleted: false,
        status: "active",
      })
        .select("product_id price discount thumbnail")
        .lean()
    : [];

  const variantsByProductId = variants.reduce((accumulator, variant) => {
    const productId = String(variant.product_id);
    if (!accumulator.has(productId)) {
      accumulator.set(productId, []);
    }
    accumulator.get(productId).push(variant);
    return accumulator;
  }, new Map());
  const hotProductsByRoot = new Map();

  latestProducts.forEach((product) => {
    const rootId =
      getRootCategoryId(product.category_id, categoryMap) ||
      getRootCategoryIdFromBrand(product.brand_id, brandMapById, brandRootMap);
    if (!rootId) return;

    if (!hotProductsByRoot.has(rootId)) {
      hotProductsByRoot.set(rootId, []);
    }

    const bucket = hotProductsByRoot.get(rootId);
    if (bucket.length >= HOT_PRODUCTS_LIMIT) {
      return;
    }

    bucket.push(formatProduct(product, variantsByProductId));
  });

  return rootCategories.map((rootCategory) => {
      const rootId = String(rootCategory._id);
      const secondLevelItems = childrenByParent.get(rootId) || [];

      const brandGroups = secondLevelItems
        .map((subCategory) => {
          const thirdLevelItems = childrenByParent.get(String(subCategory._id)) || [];
          return {
            title: subCategory.title,
            slug: subCategory.slug,
            href: `/products?category=${subCategory.slug}`,
            items: thirdLevelItems.map((brandCategory) => ({
              title: brandCategory.title,
              slug: brandCategory.slug,
              href: `/products?keyword=${encodeURIComponent(brandCategory.title)}`,
              logo:
                brandLogoMap.get(String(brandCategory.slug || "").trim().toLowerCase()) ||
                brandLogoMap.get(String(brandCategory.title || "").trim().toLowerCase()) ||
                brandCategory.thumbnail ||
                "",
            })),
          };
        })
        .filter((group) => group.items.length > 0);

      return {
        _id: rootCategory._id,
        title: rootCategory.title,
        slug: rootCategory.slug,
        icon: normalizeCategoryIcon(rootCategory.icon),
        href: `/products?category=${rootCategory.slug}`,
        brandGroups,
        hotProducts: hotProductsByRoot.get(rootId) || [],
      };
    });
}

module.exports = async (req, res, next) => {
  try {
    const menuItems = await buildMegaMenuData();
    res.locals.megaMenuCategories = menuItems.length ? menuItems : fallbackMegaMenu;
  } catch (error) {
    console.error("Mega menu middleware error:", error.message);
    res.locals.megaMenuCategories = fallbackMegaMenu;
  }

  next();
};
