const express = require('express'); // gọi express vào
const router = express.Router(); // dùng phương thức tạo router trong express 
const ChatAiController = require("../../controllers/client/chatbotAi.controller") ; 


router.post('/chat-search' , ChatAiController.ChatSearch);

module.exports = router; // exports router home ra
