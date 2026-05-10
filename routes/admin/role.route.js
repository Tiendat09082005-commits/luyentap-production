const express = require('express');
const router = express.Router();
const controller = require("../../controllers/admin/roles.controller");
const authMiddleware = require("../../middleware/admin/auth.middleware");
const roleMiddleware = require("../../middleware/admin/role.middleware");

router.get("/" , authMiddleware.checkPermission("roles_view"), roleMiddleware.validateGetRolesMiddleware,controller.index);

router.post("/create" , authMiddleware.checkPermission("roles_create"),roleMiddleware.validateCreateRoleMiddleware, controller.createPost);

router.get("/detail/:id" , authMiddleware.checkPermission("roles_view"), roleMiddleware.validateGetRoleDetailMiddleware,controller.detail);

router.get("/edit/:id" , authMiddleware.checkPermission("roles_edit"), roleMiddleware.validateEditRoleMiddleware,controller.edit);

router.patch("/edit/:id" , authMiddleware.checkPermission("roles_edit"), roleMiddleware.validateUpdateRoleMiddleware,controller.editPatch);

router.delete("/delete/:id" , authMiddleware.checkPermission("roles_delete"), roleMiddleware.validateDeleteRoleMiddleware,controller.delete);

router.get("/permission" , authMiddleware.checkPermission("roles_permissions"), roleMiddleware.validateGetPermissionRolesMiddleware,controller.permission);

router.patch("/permission" , authMiddleware.checkPermission("roles_permissions"), roleMiddleware.validatePermissionPatchMiddleware,controller.permissionPatch);

module.exports = router;