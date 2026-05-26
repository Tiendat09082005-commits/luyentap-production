const homeService = require("../../services/client/home.service");
const flash = require("../../helpers/flash.helper");

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
    console.error("HOME CONTROLLER ERROR:", error);
    flash.flashError(req, "Có lỗi xảy ra khi tải trang chủ");
    next(error);
  }
};
