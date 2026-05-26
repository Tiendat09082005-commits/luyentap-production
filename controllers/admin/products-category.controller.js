const treeHelper = require("../../helpers/tree");
const { CATEGORY_ICON_PRESETS, DEFAULT_CATEGORY_ICON } = require("../../config/category-icons");
const categoryService = require("../../services/admin/product-category.service");
const flash = require("../../helpers/flash.helper");
const AppError = require("../../utils/AppError");
const ERROR_CODE = require("../../constants/error-code");


// [GET] admin/products-category
module.exports.index = async (req, res) => {
  try {
    const { tree, stats } =
      await categoryService.getCategoryTreeWithStats(treeHelper);

    res.render("admin/pages/products-category/index", {
      pageTitle: "Quản lý danh mục sản phẩm",
      records: tree,
      stats,
      categoryIconPresets: CATEGORY_ICON_PRESETS,
      defaultCategoryIcon: DEFAULT_CATEGORY_ICON, // Issue 15 Fix
    });
  } catch (error) {
    console.error("GET PRODUCTS-CATEGORY INDEX ERROR:", error);
    flash.flashError(req, "Đã xảy ra lỗi khi tải danh mục sản phẩm");
    res.redirect("/admin/dashboard");
  }
};

// [POST] admin/products-category/create
module.exports.createPost = async (req, res) => {
  try {
    const result = await categoryService.createCategory(req.body);

    return res.status(201).json({
      success: true,
      data: result.data,
      message: "Tạo danh mục thành công",
    });
  } catch (error) {
    console.error("CREATE CATEGORY ERROR:", error);

    const statusCode = error.statusCode || error.status || 500;
    const message = error.message || "Lỗi server";
    const code = error.code || ERROR_CODE.INTERNAL_SERVER_ERROR;

    return res.status(statusCode).json({
      success: false,
      message,
      code,
    });
  }
};

// [PATCH] admin/products-category/edit/:id
module.exports.editPatch = async (req, res) => {
  try {
    const result = await categoryService.updateCategory(
      req.params.id,
      req.body
    );

    return res.json({
      success: true,
      data: result.data,
      message: "Cập nhật thành công",
    });
  } catch (error) {
    console.error("UPDATE CATEGORY ERROR:", error);

    const statusCode = error.statusCode || error.status || 500;
    const message = error.message || "Lỗi server khi cập nhật danh mục";
    const code = error.code || ERROR_CODE.INTERNAL_SERVER_ERROR;

    return res.status(statusCode).json({
      success: false,
      message,
      code,
    });
  }
};

// [DELETE] admin/products-category/delete/:id
module.exports.delete = async (req, res) => {
  try {
    const result = await categoryService.deleteCategory(req.params.id);

    return res.json({
      success: true,
      message: "Xóa thành công",
    });
  } catch (error) {
    console.error("DELETE CATEGORY ERROR:", error);

    const statusCode = error.statusCode || error.status || 500;
    const message = error.message || "Lỗi server";
    const code = error.code || ERROR_CODE.INTERNAL_SERVER_ERROR;

    return res.status(statusCode).json({
      success: false,
      message,
      code,
    });
  }
};
