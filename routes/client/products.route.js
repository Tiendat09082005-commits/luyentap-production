const express = require('express');
const router = express.Router();
const productsController = require("../../controllers/client/products.controller")

router.get('/', productsController.index);

router.get('/detail/:id', productsController.detail);

router.patch('/favorite/:productId', productsController.productFavorite);



module.exports = router; // exports router products ra 