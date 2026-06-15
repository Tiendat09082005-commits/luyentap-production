const express = require('express');
const router = express.Router();
const productsController = require("../../controllers/client/products.controller");
const authMiddleware = require("../../middleware/client/auth.middleware");

router.get('/', productsController.index);

router.get('/detail/:id', productsController.detail);

router.patch('/favorite/:productId', authMiddleware.requireAuthJSON, productsController.productFavorite);

module.exports = router; // exports router products ra 