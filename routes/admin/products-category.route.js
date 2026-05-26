const express = require("express");
const multer = require("multer");

const router = express.Router();
const controller = require("../../controllers/admin/products-category.controller");
const authMiddleware = require("../../middleware/admin/auth.middleware");
const uploadCloud = require("../../middleware/admin/uploadImage.middleware");
const productCategoryMiddleware = require("../../middleware/admin/product-category.middleware");

// Issue 14 Fix: giới hạn file size 5MB
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 },
});

function handleMulterError(err, req, res, next) {
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "Anh qua lon, vui long chon anh duoi 5MB",
    });
  }
  next(err);
}

router.get("/",authMiddleware.checkPermission("products-category_view"),controller.index);


router.post("/create",authMiddleware.checkPermission("products-category_create"),upload.single("thumbnail"),handleMulterError,uploadCloud.upload,productCategoryMiddleware.validateCreate,controller.createPost);


router.patch("/edit/:id",authMiddleware.checkPermission("products-category_edit"),upload.single("thumbnail"),handleMulterError,uploadCloud.upload,productCategoryMiddleware.validateEdit,controller.editPatch);


router.delete( "/delete/:id",authMiddleware.checkPermission("products-category_delete"),controller.delete);

module.exports = router;
