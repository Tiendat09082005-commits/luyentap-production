const homeService = require("../../services/client/home.service");
const flash = require("../../helpers/flash.helper");

module.exports.index = async (req, res, next) => {
  try {
    const siteSettings = res.locals.siteSettings || {};
    const now = new Date();
    const startTime = siteSettings.flashSaleStartTime ? new Date(siteSettings.flashSaleStartTime) : null;
    const endTime = siteSettings.flashSaleEndTime ? new Date(siteSettings.flashSaleEndTime) : null;

    const isFlashSaleActive = siteSettings.flashSaleEnabled &&
                              (!startTime || now >= startTime) &&
                              (!endTime || now <= endTime);

    const [productsFlashSale, productsFeatured, homeCategories] =
      await Promise.all([
        isFlashSaleActive
          ? homeService.getFlashSaleProducts(siteSettings.flashSaleProductIds)
          : Promise.resolve([]),
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
