const express = require('express');
const router = express.Router();
const controller = require("../../controllers/admin/products.controller");
const multer = require('multer');
// const storageMulter = require("../../helpers/storageMulter");

const upload = multer();
const uploadCloud = require("../../middleware/admin/uploadImage.middleware");
const validate = require("../../middleware/admin/validate.middleware");
const {createProductValidator} = require("../../validate/admin/createProduct.validate");
const authMiddleware = require("../../middleware/admin/auth.middleware");
const csrfMiddleware = require("../../middleware/csrf");

router.get("/" , authMiddleware.checkPermission("products_view"), controller.index);

router.patch("/change-status/:status/:id" , authMiddleware.checkPermission("products_edit"), controller.changeStatus);

router.patch("/change-multi" , authMiddleware.checkPermission("products_edit"), controller.changeMulti);

router.delete("/delete/:id" , authMiddleware.checkPermission("products_delete"), controller.deleteSoft);

router.get("/create" , authMiddleware.checkPermission("products_create"), controller.create);

router.post("/create", authMiddleware.checkPermission("products_create"), upload.any(), csrfMiddleware, uploadCloud.upload, validate(createProductValidator), controller.createPost);

router.get("/edit/:id" , authMiddleware.checkPermission("products_edit"), controller.edit);

router.patch("/edit/:id", authMiddleware.checkPermission("products_edit"), upload.any(), csrfMiddleware, uploadCloud.upload, validate(createProductValidator), controller.editPatch);

router.get("/detail/:id" , authMiddleware.checkPermission("products_view"), controller.detail);

router.get("/trash" , authMiddleware.checkPermission("products_view_trash"), controller.trash);

router.patch("/restore/:id", authMiddleware.checkPermission("products_view_trash"), controller.restore);

router.delete("/hard-delete/:id", authMiddleware.checkPermission("products_delete"), controller.hardDelete);

module.exports = router;