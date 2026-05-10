const express = require('express'); // gọi express vào
const router = express.Router(); // dùng phương thức tạo router trong express 
const homeController = require("../../controllers/client/home.controller") ; 

router.get('/', homeController.index);

module.exports = router; // exports router home ra
