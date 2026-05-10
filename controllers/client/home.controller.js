const homeService = require("../../services/client/home.service");

module.exports.index = async (req, res, next) => {
  try {
    const [productsFlashSale, productsFeatured, homeCategories] =
      await Promise.all([
        homeService.getFlashSaleProducts(),
        homeService.getFeaturedProducts(),
        homeService.getHomeCategories(),
      ]);

    res.render("client/pages/home/index.pug", {
      productsFlashSale,
      productsFeatured,
      homeCategories,
    });
  } catch (error) {
    next(error);
  }
};

