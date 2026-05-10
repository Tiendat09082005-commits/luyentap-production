const express = require('express');
const router = express.Router();


// IMPORT ROUTES
const homeRouter = require("./home.route");
const productsRouter = require("./products.route");
const userRouter = require("./user.route");
const cartRouter = require("./cart.route");
const checkOutRouter = require("./checkout.route");
const chatRouter = require("./chat.route");
const orderRouter = require("./order.route");
const paymentRouter = require("./payment.route");
const apiSearchRouter = require("./search.route");
const commentRouter = require("./comment.route");


// IMPORT MIDDLEWARE
const authMiddleware = require("../../middleware/client/auth.middleware");
const cartMiddleware = require("../../middleware/client/cart.middleware");
const megaMenuMiddleware = require("../../middleware/client/mega-menu.middleware");


// GLOBAL MIDDLEWARE (ÁP DỤNG CHO CLIENT)
router.use(authMiddleware.checkUserLogin); 
// check user login (gắn user vào req/res.locals)

router.use(cartMiddleware.countItemInCart); 
// đếm số lượng sản phẩm trong giỏ

router.use(megaMenuMiddleware); 
// load menu category


// ROUTES PUBLIC
router.use("/", homeRouter);
router.use("/products", productsRouter);
router.use("/user", userRouter);
router.use("/cart", cartRouter);
router.use("/chat", chatRouter);
router.use("/payment", paymentRouter);
router.use("/api/search", apiSearchRouter);
router.use("/comments", commentRouter);


// ROUTES CẦN AUTH
router.use("/checkout", authMiddleware.requireAuthCheckOut, checkOutRouter);

router.use("/orders", authMiddleware.requireAuth, orderRouter);


// EXPORT
module.exports = router;