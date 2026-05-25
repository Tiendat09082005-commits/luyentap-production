const express = require('express');
const router = express.Router();


// IMPORT ROUTES
const dashboardRoute = require("./dashboard.route");
const productsRoute = require("./products.route");
const productsCategoryRoute = require("./products-category.route");
const roleRoute = require("./role.route");
const accountRoute = require("./account.route");
const authRoute = require("./auth.route");
const myAccountRoute = require("./my-account.route");
const orderRoute = require("./order.route");
const messageRoute = require("./message.route");

const settingRoute = require("./setting.route");
const brandRoute = require("./brand.route");
const attributeRoute = require("./attribute.route");
const searchRoute = require("./search.route");


// IMPORT MIDDLEWARE
const authMiddleware = require("../../middleware/admin/auth.middleware");

// PUBLIC ROUTES (KHÔNG CẦN LOGIN)
router.use("/auth", authRoute);

// PRIVATE ROUTES (CẦN LOGIN)

// tất cả route bên dưới bắt buộc đăng nhập
router.use(authMiddleware.authLogin);

// ADMIN ROUTES
router.use("/dashboard", dashboardRoute);
router.use("/products", productsRoute);
router.use("/products-category", productsCategoryRoute);
router.use("/roles", roleRoute);
router.use("/accounts", accountRoute);
router.use("/my-account", myAccountRoute);
router.use("/order", orderRoute);
router.use("/messages", messageRoute);

router.use("/setting", settingRoute);
router.use("/brands", brandRoute);
router.use("/attribute", attributeRoute);
router.use("/search", searchRoute);


// EXPORT
module.exports = router;
