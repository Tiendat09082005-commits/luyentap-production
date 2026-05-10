const ProductCategory = require("../../models/products-category.model");
const treeHelper = require("../../helpers/tree");
const { CATEGORY_ICON_PRESETS, DEFAULT_CATEGORY_ICON } = require("../../config/category-icons");
const categoryService = require("../../services/admin/product-category.service");


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
    console.error(error);
    res.redirect("/admin/dashboard");
  }
};

// [POST] admin/products-category/create
module.exports.createPost = async (req, res) => {
  try {
    const result = await categoryService.createCategory(req.body);

    if (result.error) {
      return res.status(result.error.status).json(result.error.payload);
    }

    return res.status(201).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Loi server",
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

    if (result.error) {
      return res.status(result.error.status).json(result.error.payload);
    }

    return res.json({
      success: true,
      data: result.data,
      message: "Cap nhat thanh cong",
    });
  } catch (error) {
    console.error("Loi cap nhat danh muc:", error);
    return res.status(500).json({
      success: false,
      message: "Loi server khi cap nhat danh muc",
    });
  }
};

// [DELETE] admin/products-category/delete/:id
module.exports.delete = async (req, res) => {
  try {
    const result = await categoryService.deleteCategory(req.params.id);

    if (result.error) {
      return res.status(result.error.status).json(result.error.payload);
    }

    return res.json({
      success: true,
      message: "Xoa thanh cong",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Loi server",
    });
  }
};
