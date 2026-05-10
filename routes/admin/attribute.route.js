const express = require('express');
const router = express.Router();
const controller = require("../../controllers/admin/attribute.controller");
const authMiddleware = require("../../middleware/admin/auth.middleware");
const attributeMiddleware = require("../../middleware/admin/attribute.middleware");


const validate = require("../../middleware/admin/validate.middleware");
const { attributeValidator } = require("../../validate/admin/attribute.validate");

router.get("/" , authMiddleware.checkPermission("attributes_view"), attributeMiddleware.validateGetAttributesMiddleware , controller.index);

router.post("/create" , authMiddleware.checkPermission("attributes_create"), attributeMiddleware.validateCreateAttributeMiddleware, controller.create);

router.delete("/delete/:slug" , authMiddleware.checkPermission("attributes_delete"),attributeMiddleware.validateDeleteAttributeMiddleware,  controller.delete);

router.patch("/edit/:slug" , authMiddleware.checkPermission("attributes_edit"), attributeMiddleware.validateEditAttributeMiddleware, controller.edit);




module.exports = router;