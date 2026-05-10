const express = require('express');
const router = express.Router();
const controller = require("../../controllers/admin/message.controller");

router.get("/" , controller.index);
router.get("/:conversationId" , controller.loadMessage);


module.exports = router;