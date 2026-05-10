const express = require('express');
const router = express.Router();
const controller = require("../../controllers/admin/order.controller");
const authMiddleware = require("../../middleware/admin/auth.middleware");
const orderMiddleware = require("../../middleware/admin/order.middleware");

router.get("/" , authMiddleware.checkPermission("orders_view"), controller.index);
router.post("/update-status" , authMiddleware.checkPermission("orders_edit"), controller.updateStatus);
router.patch("/delete-order" , authMiddleware.checkPermission("orders_delete"), orderMiddleware.validateDeleteOrderMiddleware ,controller.deleteItem);
router.get("/suggest" , authMiddleware.checkPermission("orders_view"), orderMiddleware.validateSuggestMiddleware,controller.Suggest);
router.get("/detail" , authMiddleware.checkPermission("orders_view"), orderMiddleware.validateGetOrderDetailMiddleware,controller.detail);
module.exports = router;