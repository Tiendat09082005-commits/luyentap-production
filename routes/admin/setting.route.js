const express = require("express");
const multer = require("multer");
const router = express.Router();
const controller = require("../../controllers/admin/setting.controller");
const uploadCloud = require("../../middleware/admin/uploadImage.middleware");
const settingMiddleware = require("../../middleware/admin/setting.middleware");

const upload = multer();

router.get("/", controller.index);
router.post(
  "/",
  upload.any(),
  uploadCloud.upload,
  settingMiddleware.validateUpdateSettingsMiddleware,
  controller.update
);

module.exports = router;
