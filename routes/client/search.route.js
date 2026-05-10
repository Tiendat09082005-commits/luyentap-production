const express = require('express');
const router = express.Router();
const controller = require('../../controllers/api/search.controller');

router.get('/products', controller.searchProducts);
router.get('/products/suggest', controller.suggestProducts);

module.exports = router;
