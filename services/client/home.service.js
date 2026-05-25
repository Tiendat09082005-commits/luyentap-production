const Product = require("../../models/products.model");
const ProductVariant = require("../../models/productVariant.model");
const ProductCategory = require("../../models/products-category.model");
const { priceNew } = require("../../helpers/priceNew");
const { normalizeCategoryIcon } = require("../../config/category-icons");

// 🔥 FLASH SALE (1 query, không N+1)
const getFlashSaleProducts = async () => {
  const data = await ProductVariant.aggregate([
    {
      $match: {
        deleted: false,
        status: "active",
        discount: { $gt: 0 },
      },
    },
    { $sort: { discount: -1 } },
    {
      $group: {
        _id: "$product_id",
        discount: { $first: "$discount" },
        price: { $first: "$price" },
        thumbnail: { $first: "$thumbnail" },
      },
    },
    { $sort: { discount: -1 } },
    { $limit: 4 },

    //  JOIN luôn product
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },

    {
      $match: {
        "product.deleted": false,
        "product.status": "active",
      },
    },
  ]);

  return data.map((item) => ({
    ...item.product,
    discount: item.discount,
    price: item.price,
    priceNew: priceNew(item.price, item.discount),
    thumbnail: item.thumbnail || item.product.thumbnail,
  }));
};

//  FEATURED (giải quyết N+1 bằng lookup)
const getFeaturedProducts = async () => {
  const products = await Product.aggregate([
    {
      $match: {
        deleted: false,
        status: "active",
      },
    },
    { $sort: { createdAt: -1 } },
    { $limit: 10 },

    {
      $lookup: {
        from: "product_variants",
        localField: "_id",
        foreignField: "product_id",
        as: "variants",
      },
    },
  ]);

  return products.map((product) => {
    if (!product.variants.length) {
      const price = product.price || 0;
      const discount = product.discount || 0;

      return {
        ...product,
        price,
        discount,
        priceNew: priceNew(price, discount),
      };
    }

    //  tính 1 lần
    const variants = product.variants.map((v) => {
      const newPrice = priceNew(v.price, v.discount);
      return { ...v, newPrice };
    });

    const minVariant = variants.reduce((min, v) =>
      v.newPrice < min.newPrice ? v : min
    );

    return {
      ...product,
      price: minVariant.price,
      discount: minVariant.discount,
      priceNew: minVariant.newPrice,
      thumbnail:
        product.thumbnail ||
        variants.find((v) => v.thumbnail)?.thumbnail,
    };
  });
};

//  CATEGORY
const getHomeCategories = async () => {
  const [categories, counts] = await Promise.all([
    ProductCategory.find({
      deleted: false,
      status: "active",
      parent_id: null,
    })
      .sort({ position: 1, createdAt: 1 })
      .limit(6)
      .lean(),

    Product.aggregate([
      {
        $match: {
          deleted: false,
          status: "active",
          category_id: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$category_id",
          total: { $sum: 1 },
        },
      },
    ]),
  ]);

  const countMap = counts.reduce((acc, item) => {
    acc[item._id.toString()] = item.total;
    return acc;
  }, {});

  return categories.map((cat) => ({
    ...cat,
    icon: normalizeCategoryIcon(cat.icon),
    href: `/products?category=${cat.slug}`,
    productCount: countMap[cat._id.toString()] || 0,
  }));
};

module.exports = {
  getFlashSaleProducts,
  getFeaturedProducts,
  getHomeCategories,
};