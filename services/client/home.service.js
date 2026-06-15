const homeRepo = require("../../repositories/client/home.repository");
const { priceNew } = require("../../helpers/priceNew");
const { normalizeCategoryIcon } = require("../../config/category-icons");

// 🔥 FLASH SALE (1 query, không N+1)
const getFlashSaleProducts = async (productIds) => {
  const data = await homeRepo.getFlashSaleVariants(productIds);

  return data.map((item) => {
    const prod = item.product || {};
    return {
      ...prod,
      rating: prod.rating || 5,
      discount: item.discount,
      price: item.price,
      priceNew: priceNew(item.price, item.discount),
      thumbnail: item.thumbnail || prod.thumbnail,
    };
  });
};

//  FEATURED (giải quyết N+1 bằng lookup)
const getFeaturedProducts = async () => {
  const products = await homeRepo.getFeaturedProducts();

  return products.map((product) => {
    const rating = product.rating || 5;
    if (!product.variants.length) {
      const price = product.price || 0;
      const discount = product.discount || 0;

      return {
        ...product,
        rating,
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
      rating,
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
    homeRepo.getHomeCategories(),
    homeRepo.getCategoryProductCounts(),
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