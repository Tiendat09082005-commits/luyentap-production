const systemConfig = require("../../config/system");
const brandService = require("../../services/admin/brand.service");
const flash = require("../../helpers/flash.helper");
const ERROR_CODE = require("../../constants/error-code");

// [GET] admin/brand/
module.exports.index = async (req, res) => {
  try {
    const { brands, keyword, status } = await brandService.getBrands(req.query);

    res.render("admin/pages/brand/index", {
      brands,
      keyword,
      status,
      currentPage: 1,
      pageSize: brands.length || 10,
      totalPages: 1,
    });
  } catch (error) {
    console.error("GET BRAND ERROR:", error);

    flash.flashError(req, "Đã xảy ra lỗi");
    return res.redirect(`${systemConfig.prefixAdmin}/dashboard`);
  }
};

//[POST] admin/brand/create
module.exports.create = async (req, res) => {
  try {
    await brandService.createBrand(req.body);

    flash.flashSuccess(req, "Tạo brand thành công");
    return res.redirect(`${systemConfig.prefixAdmin}/brands`);
  } catch (error) {
    console.error("CREATE BRAND ERROR:", error);

    if (error.code === ERROR_CODE.BRAND_DUPLICATE_SLUG) {
      flash.flashError(req, "Brand đã tồn tại (slug bị trùng)");
    } else {
      flash.flashError(req, "Lỗi server");
    }

    return res.redirect(`${systemConfig.prefixAdmin}/brands`);
  }
};

//[GET] admin/brand/detail/:id
module.exports.detail = async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await brandService.getBrandDetail(id);

    res.render("admin/pages/brand/detail", {
      pageTitle: "Chi tiết thương hiệu",
      brand,
    });
  } catch (error) {
    console.error("DETAIL BRAND ERROR:", error);

    if (error.code === ERROR_CODE.BRAND_NOT_FOUND) {
      flash.flashError(req, "Không tìm thấy thương hiệu!");
    } else {
      flash.flashError(req, "Có lỗi xảy ra!");
    }

    return res.redirect(`${systemConfig.prefixAdmin}/brands`);
  }
};

// [PATCH] admin/brand/change-status/:status/:id
module.exports.changeStatus = async (req, res) => {
  try {
    const { id, status } = req.params;

    await brandService.changeStatusBrand(id, status);

    flash.flashSuccess(req, "Đã cập nhật trạng thái thương hiệu");
  } catch (error) {
    console.error("CHANGE STATUS BRAND ERROR:", error);

    if (error.code === ERROR_CODE.BRAND_NOT_FOUND) {
      flash.flashError(req, "Không tìm thấy thương hiệu");
    } else {
      flash.flashError(req, "Cập nhật trạng thái thất bại");
    }
  }

  return res.redirect(`${systemConfig.prefixAdmin}/brands`);
};

//[POST] admin/brand/edit/:id
module.exports.edit = async (req, res) => {
  try {
    const { id } = req.params;

    await brandService.updateBrand(id, req.body);

    flash.flashSuccess(req, "Cập nhật thương hiệu thành công!");
  } catch (error) {
    console.error("UPDATE BRAND ERROR:", error);

    if (error.code === ERROR_CODE.BRAND_NOT_FOUND) {
      flash.flashError(req, "Không tìm thấy thương hiệu");
    } else if (error.code === ERROR_CODE.BRAND_DUPLICATE_SLUG) {
      flash.flashError(req, "Tên brand bị trùng");
    } else {
      flash.flashError(req, "Cập nhật thất bại");
    }
  }

  return res.redirect(`${systemConfig.prefixAdmin}/brands`);
};

//[POST] admin/brand/delete/:id
module.exports.deleteSoft = async (req, res) => {
  try {
    const { id } = req.params;

    await brandService.deleteBrand(id);

    flash.flashSuccess(req, "Xóa thương hiệu thành công!");
  } catch (error) {
    console.error("DELETE BRAND ERROR:", error);

    if (error.code === ERROR_CODE.BRAND_NOT_FOUND_OR_DELETED) {
      flash.flashError(req, "Không tìm thấy hoặc đã bị xóa");
    } else {
      flash.flashError(req, "Xóa thương hiệu thất bại");
    }
  }

  return res.redirect(`${systemConfig.prefixAdmin}/brands`);
};
