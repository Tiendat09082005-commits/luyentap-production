const express = require('express'); // gọi express vào
const router = express.Router(); // dùng phương thức tạo router trong express 
const cartController = require("../../controllers/client/cart.controller") ; 
const validate = require("../../validate/client/cart.validate");
const middleware = require("../../middleware/client/cart.middleware");

router.get('/' , cartController.index);

router.post('/add', validate.checkStockAdd,middleware.checkLogin,cartController.addPost);

router.post('/delete/:productId', middleware.checkLogin, cartController.deletedPost);
router.post('/delete/:productId/:variantId', middleware.checkLogin, cartController.deletedPost);

router.post('/update/:productId/:quantity', validate.checkStockUpdate, middleware.checkLogin, cartController.updatePost);
router.post('/update/:productId/:quantity/:variantId', validate.checkStockUpdate, middleware.checkLogin, cartController.updatePost);

router.get('/count', cartController.getCount);


module.exports = router; // exports router home ra
