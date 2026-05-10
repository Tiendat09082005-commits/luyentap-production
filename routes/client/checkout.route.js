const express = require("express"); // gọi express vào
const router = express.Router(); // dùng phương thức tạo router trong express
const controller = require("../../controllers/client/checkout.controller");


router.get("/payment-info", controller.paymentInfo);
router.post("/payment-info", controller.paymentInfo);
router.post("/buy-now", controller.buyNow);
router.post("/payment", controller.payment);
router.post("/order", controller.order);
router.get("/success", controller.success);
router.get("/pending", controller.pending);
router.get("/vnpay-return", controller.vnpayReturn);
router.get("/fail", controller.fail);


module.exports = router;
