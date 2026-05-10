const express = require("express");
const router = express.Router();
const controller = require("../../controllers/client/order.controller");
const authMiddleware = require("../../middleware/client/auth.middleware");
const validate = require("../../validate/client/order.validate");

router.get("/:id", authMiddleware.requireAuth, validate.detail, controller.detail);

module.exports = router;
