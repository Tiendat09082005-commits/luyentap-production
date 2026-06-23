const express = require('express');
const router = express.Router();
const controller = require("../../controllers/admin/account.controller");
const multer = require('multer');
const upload = multer();
const uploadCloud = require("../../middleware/admin/uploadImage.middleware");
const authMiddleware = require("../../middleware/admin/auth.middleware");
const accountMiddleware = require("../../middleware/admin/account.middleware");
const csrfMiddleware = require("../../middleware/csrf");

router.get("/" , authMiddleware.checkPermission("account_view"), controller.index);

router.get("/create" , authMiddleware.checkPermission("account_create"), controller.create);

router.post("/create" , authMiddleware.checkPermission("account_create"), upload.single('avatar'), csrfMiddleware, uploadCloud.upload, accountMiddleware.validateCreate, controller.createPost);

router.get("/edit/:id" , authMiddleware.checkPermission("account_edit"), accountMiddleware.validateEditGet,  controller.edit);

router.patch("/edit/:id" , authMiddleware.checkPermission("account_edit"), upload.single('avatar'), csrfMiddleware, uploadCloud.upload, accountMiddleware.validateEditPatch, controller.editPatch);

router.get("/detail/:id" , authMiddleware.checkPermission("account_view"),accountMiddleware.validateDetail , controller.detail);

router.get("/user" , authMiddleware.checkPermission("account_view"),accountMiddleware.validateAccountUserMiddleware, controller.accountUser);

router.patch("/user/change-status/:status/:id" , authMiddleware.checkPermission("account_edit"),accountMiddleware.validateChangeStatusUserMiddleware, controller.changeStatusUser);

router.delete("/user/delete/:id" , authMiddleware.checkPermission("account_delete"),accountMiddleware.validateDeleteUserMiddleware, controller.deleteUser);

const systemConfig = require("../../config/system");

router.patch("/user/restore/:id" , authMiddleware.checkPermission("account_edit"), accountMiddleware.validateRestoreUserMiddleware , controller.restoreUser);

router.get("/user/orders/:userId", authMiddleware.checkPermission("account_view"), (req, res) => {
  res.redirect(`${systemConfig.prefixAdmin}/order?userId=${req.params.userId}`);
});

module.exports = router;