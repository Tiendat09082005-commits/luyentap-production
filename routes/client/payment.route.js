const express = require("express");
const router = express.Router();
const controller = require("../../controllers/client/payment.controller");
const authMiddleware = require("../../middleware/client/auth.middleware");

router.get("/vnpay-ipn", controller.vnpayIPN);
router.get("/vnpay-return", controller.vnpayReturn);

module.exports = router;