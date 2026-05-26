const conFig = require("../../config/system");
const filterStatusHelper = require("../../helpers/filterStatus");
const searchHelper = require("../../helpers/search");
const paginationHelper = require("../../helpers/pagination");
const { buildCategoryBrandMap } = require("../../helpers/productui.helper");
const { validateStatus, validateChangeMultiInput } = require("../../validate/admin/product.validate");
const productService = require("../../services/admin/product.service");
const flash = require("../../helpers/flash.helper");

// ─── [GET] /admin/products 

module.exports.index = async (req, res) => {
  try {
    const find = { deleted: false };
    if (req.query.status) find.status = req.query.status;

    const filterStatus = filterStatusHelper(req.query);
    const search = searchHelper(req.query);
    if (search.regex) find.title = search.regex;

    const totalProduct = await require("../../models/products.model").countDocuments(find);
    const pagination = paginationHelper(req.query, totalProduct);

    // Chạy song song: stats + fix position + danh sách sản phẩm
    await productService.fixZeroPositions();
    const [stats, products] = await Promise.all([
      productService.getProductStats(),
      productService.getProductList(find, pagination),
    ]);

    res.render("admin/pages/products/index", {
      products,
      filterStatus,
      pagination,
      keyword: req.query.keyword,
      stats,
    });
  } catch (error) {
    console.error("INDEX ERROR:", error);
    flash.flashError(req, "Đã có lỗi xảy ra");
    res.redirect(req.get("Referer") || `${conFig.prefixAdmin}/products`);
  }
};

// ─── [PATCH] /admin/products/change-status/:status/:id 

module.exports.changeStatus = async (req, res) => {
  const { status, id } = req.params;

  const check = validateStatus(status);
  if (!check.valid) {
    flash.flashError(req, check.message);
    return res.redirect(req.get("Referer"));
  }

  await productService.changeStatus(id, status);
  res.redirect(req.get("Referer"));
};

// ─── [PATCH] /admin/products/change-multi 

module.exports.changeMulti = async (req, res) => {
  const check = validateChangeMultiInput(req.body);
  if (!check.valid) {
    flash.flashError(req, check.message);
    return res.redirect(req.get("Referer") || `${conFig.prefixAdmin}/products`);
  }

  const { type, ids: idsRaw } = req.body;
  const ids = idsRaw.split(", ");

  await productService.changeMulti(type, ids);

  const messages = {
    "active": "Đã cập nhật trạng thái thành hoạt động",
    "inactive": "Đã cập nhật trạng thái thành dừng hoạt động",
    "change-position": "Đã cập nhật vị trí các sản phẩm",
    "delete-all": "Đã xóa các sản phẩm thành công",
  };
  flash.flashSuccess(req, messages[type]);
  res.redirect(req.get("referer"));
};

// ─── [DELETE] /admin/products/delete/:id 

module.exports.deleteSoft = async (req, res) => {
  await productService.softDelete(req.params.id);
  res.redirect(req.get("referer"));
};

// ─── [GET] /admin/products/create 

module.exports.create = async (req, res) => {
  try {
    const { categories, attributes } = await productService.getFormData();
    const { rootCategories, brandCategoriesByRoot } = buildCategoryBrandMap(categories);

    res.render("admin/pages/products/create", {
      brands: [],
      pageTitle: "Thêm sản phẩm",
      rootCategories,
      brandCategoriesByRoot,
      attributes,
    });
  } catch (error) {
    console.error("CREATE GET ERROR:", error);
    flash.flashError(req, "Đã có lỗi xảy ra");
    res.redirect(`${conFig.prefixAdmin}/products`);
  }
};

// ─── [POST] /admin/products/create 

module.exports.createPost = async (req, res) => {
  const result = await productService.createProduct(req.body);

  if (!result.success) {
    flash.flashError(req, result.error);
    return res.redirect(req.get("Referer"));
  }

  flash.flashSuccess(req, "Tạo sản phẩm thành công");
  res.redirect(req.get("Referer"));
};

// ─── [GET] /admin/products/edit/:id 

module.exports.edit = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productService.getProductForEdit(id);

    if (!product) {
      flash.flashError(req, "Sản phẩm không tồn tại");
      return res.redirect(`${conFig.prefixAdmin}/products`);
    }

    const [{ categories, attributes }, variants] = await Promise.all([
      productService.getFormData(),
      productService.getVariantsForEdit(id),
    ]);

    const { rootCategories, brandCategoriesByRoot } = buildCategoryBrandMap(categories);

    res.render("admin/pages/products/edit.pug", {
      brands: [],
      pageTitle: "Chỉnh sửa sản phẩm",
      product,
      variants,
      rootCategories,
      brandCategoriesByRoot,
      attributes,
    });
  } catch (error) {
    console.error("EDIT GET ERROR:", error);
    flash.flashError(req, "Đã có lỗi xảy ra");
    res.redirect(`${conFig.prefixAdmin}/products`);
  }
};

// ─── [PATCH] /admin/products/edit/:id 

module.exports.editPatch = async (req, res) => {
  const result = await productService.updateProduct(req.params.id, req.body);

  if (!result.success) {
    flash.flashError(req, result.error);
    return res.redirect(req.get("Referer"));
  }

  flash.flashSuccess(req, "Cập nhật sản phẩm thành công");
  res.redirect(`${conFig.prefixAdmin}/products`);
};

// ─── [GET] /admin/products/detail/:id 

module.exports.detail = async (req, res) => {
  try {
    const { product, variants } = await productService.getProductDetail(req.params.id);

    if (!product) {
      flash.flashError(req, "Sản phẩm không tồn tại");
      return res.redirect(`${conFig.prefixAdmin}/products`);
    }

    res.render("admin/pages/products/detail.pug", { product, variants });
  } catch (error) {
    console.error("DETAIL ERROR:", error);
    flash.flashError(req, "Đã có lỗi xảy ra");
    res.redirect(`${conFig.prefixAdmin}/products`);
  }
};

// ─── [GET] /admin/products/trash 

module.exports.trash = async (req, res) => {
  try {
    const find = { deleted: true };
    if (req.query.status) find.status = req.query.status;

    const filterStatus = filterStatusHelper(req.query);
    const search = searchHelper(req.query);
    if (search.regex) find.title = search.regex;

    const totalProduct = await require("../../models/products.model").countDocuments(find);
    const pagination = paginationHelper(req.query, totalProduct);

    const products = await productService.getTrashList(find, pagination);

    res.render("admin/pages/products/trash.pug", {
      products,
      filterStatus,
      keyword: req.query.keyword,
      pagination,
    });
  } catch (error) {
    console.error("TRASH ERROR:", error);
    flash.flashError(req, "Đã có lỗi xảy ra");
    res.redirect(`${conFig.prefixAdmin}/products`);
  }
};

// ─── [PATCH] /admin/products/restore/:id 

module.exports.restore = async (req, res) => {
  try {
    await productService.restoreProduct(req.params.id);
    flash.flashSuccess(req, "Khôi phục sản phẩm thành công");
  } catch (error) {
    console.error("RESTORE ERROR:", error);
    flash.flashError(req, "Đã có lỗi xảy ra khi khôi phục");
  }
  res.redirect(req.get("Referer") || `${conFig.prefixAdmin}/products/trash`);
};

// ─── [DELETE] /admin/products/hard-delete/:id 

module.exports.hardDelete = async (req, res) => {
  try {
    await productService.hardDeleteProduct(req.params.id);
    flash.flashSuccess(req, "Đã xóa vĩnh viễn sản phẩm");
  } catch (error) {
    console.error("HARD DELETE ERROR:", error);
    flash.flashError(req, "Đã có lỗi xảy ra khi xóa vĩnh viễn");
  }
  res.redirect(req.get("Referer") || `${conFig.prefixAdmin}/products/trash`);
};