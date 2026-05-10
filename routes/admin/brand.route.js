const express = require('express');
const router = express.Router();
const controller = require("../../controllers/admin/brand.controller");
const multer = require('multer');
// const storageMulter = require("../../helpers/storageMulter");

const upload = multer();
const uploadCloud = require("../../middleware/admin/uploadImage.middleware");
const authMiddleware = require("../../middleware/admin/auth.middleware");

const validate = require("../../middleware/admin/validate.middleware");
const { brandValidator } = require("../../validate/admin/brand.validate");
const brandMiddleware = require("../../middleware/admin/brand.middleware");

router.get("/" , authMiddleware.checkPermission("brands_view"), brandMiddleware.validateGetBrandsMiddleware, controller.index);

router.post("/create" , authMiddleware.checkPermission("brands_create"), upload.single('logo'), uploadCloud.upload, brandMiddleware.validateCreateBrandMiddleware, controller.create);

router.get("/detail/:id" , authMiddleware.checkPermission("brands_view"), brandMiddleware.validateGetBrandDetailMiddleware , controller.detail);

// Change brand status
router.patch("/change-status/:status/:id", authMiddleware.checkPermission("brands_edit"), brandMiddleware.validateChangeStatusBrandMiddleware,controller.changeStatus);

router.post("/edit/:id" , authMiddleware.checkPermission("brands_edit"), upload.single('logo'), uploadCloud.upload, brandMiddleware.validateEditBrandMiddleware, controller.edit);

router.delete("/delete/:id", authMiddleware.checkPermission("brands_delete"), brandMiddleware.validateDeleteBrandMiddleware,controller.deleteSoft);

module.exports = router;
