const systemConfig = require("../../config/system");
const settingService = require("../../services/admin/setting.service");

// [GET] admin/setting
module.exports.index = async (req, res) => {
  try {
    const settings = await settingService.getSettings();

    res.render("admin/pages/setting/index", {
      pageTitle: "Cai dat he thong",
      settings,
    });
  } catch (error) {
    console.error("GET SETTING ERROR:", error);
    req.flash("thatbai", "Khong the tai trang cai dat");
    res.redirect(`${systemConfig.prefixAdmin}/dashboard`);
  }
};

// [POST] admin/setting
module.exports.update = async (req, res) => {
  try {
    await settingService.updateSettings(req.body);
    req.flash("thanhcong", "Cap nhat cai dat thanh cong");
  } catch (error) {
    console.error("UPDATE SETTING ERROR:", error);
    req.flash("thatbai", "Cap nhat cai dat that bai");
  }

  res.redirect(`${systemConfig.prefixAdmin}/setting`);
};
