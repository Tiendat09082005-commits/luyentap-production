const express = require("express");
const router = express.Router();
const commentController = require("../../controllers/client/comment.controller");
const commentValidate = require("../../validate/client/comment.validate");

router.post("/", commentValidate.create, commentController.create);
router.get("/", commentValidate.index, commentController.index);

module.exports = router;
