const express = require('express'); // gọi express vào
const router = express.Router(); // dùng phương thức tạo router trong express 
const chatController = require("../../controllers/client/chat.controller") ; 
const authMiddleware = require("../../middleware/client/auth.middleware");
const chatValidate = require("../../validate/client/chat.validate");

router.get('/' , authMiddleware.requireAuth, chatController.index);
router.post('/start' , authMiddleware.requireAuth, chatController.Start);
router.post('/message' , authMiddleware.requireAuth, chatValidate.getMessages, chatController.getMessage);


module.exports = router; // exports router home ra
