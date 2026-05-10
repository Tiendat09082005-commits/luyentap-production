const Brand = require("../../models/brand.model");
const systemConfig = require("../../config/system");
const brandService = require("../../services/admin/brand.service");
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

    req.flash("thatbai", "Đã xảy ra lỗi");
    res.redirect("back");
  }
};

//[POST] admin/brand/create
module.exports.create = async (req, res) => {
  try {
    await brandService.createBrand(req.body);

    req.flash("thanhcong", "Tạo brand thành công");
    return res.redirect("back");
  } catch (error) {
    console.error("CREATE BRAND ERROR:", error);

    if (error.message === "DUPLICATE_SLUG") {
      req.flash("thatbai", "Brand đã tồn tại (slug bị trùng)");
    } else {
      req.flash("thatbai", "Lỗi server");
    }

    return res.redirect("back");
  }
};

//[GET] admin/brand/detail/:id
module.exports.detail = async (req, res) => {
    try {
        const { id } = req.params;

        const brand = await brandService.getBrandDetail(id);

        res.render("admin/pages/brand/detail", {
            pageTitle: "Chi tiết thương hiệu",
            brand
        });

    } catch (error) {
        console.error("DETAIL BRAND ERROR:", error);

        if (error.message === "BRAND_NOT_FOUND") {
            req.flash("error", "Không tìm thấy thương hiệu!");
        } else {
            req.flash("error", "Có lỗi xảy ra!");
        }

        res.redirect(`${conFig.prefixAdmin}/brands`);
    }
};


// [PATCH] admin/brand/change-status/:status/:id
module.exports.changeStatus = async (req, res) => {
    try {
        const { id, status } = req.params;

        await brandService.changeStatusBrand(id, status);

        req.flash("thanhcong", "Đã cập nhật trạng thái thương hiệu");

    } catch (error) {
        console.error("CHANGE STATUS BRAND ERROR:", error);

        if (error.message === "BRAND_NOT_FOUND") {
            req.flash("thatbai", "Không tìm thấy thương hiệu");
        } else {
            req.flash("thatbai", "Cập nhật trạng thái thất bại");
        }
    }

    return res.redirect(req.get("referer") || `${conFig.prefixAdmin}/brands`);
};


//[POST] admin/brand/edit/:id
module.exports.edit = async (req, res) => {
    try {
        const { id } = req.params;

        await brandService.updateBrand(id, req.body);

        req.flash("thanhcong", "Cập nhật thương hiệu thành công!");

    } catch (error) {
        console.error("UPDATE BRAND ERROR:", error);

        if (error.message === "BRAND_NOT_FOUND") {
            req.flash("thatbai", "Không tìm thấy thương hiệu");
        } else if (error.message === "DUPLICATE_SLUG") {
            req.flash("thatbai", "Tên brand bị trùng");
        } else {
            req.flash("thatbai", "Cập nhật thất bại");
        }
    }

    res.redirect(req.get("referer") || `${systemConfig.prefixAdmin}/brands`);
};

//[POST] admin/brand/delete/:id
module.exports.deleteSoft = async (req, res) => {
    try {
        const { id } = req.params;

        await brandService.deleteBrand(id);

        req.flash("thanhcong", "Xóa thương hiệu thành công!");

    } catch (error) {
        console.error("DELETE BRAND ERROR:", error);

        if (error.message === "BRAND_NOT_FOUND_OR_DELETED") {
            req.flash("thatbai", "Không tìm thấy hoặc đã bị xóa");
        } else {
            req.flash("thatbai", "Xóa thương hiệu thất bại");
        }
    }

    res.redirect(`${systemConfig.prefixAdmin}/brands`);
};