const express = require('express');
const router = express.Router();
const controller = require("../../controllers/admin/dashboard.controller");
const dashboardMiddleware = require("../../middleware/admin/dashboard.middleware");

router.get("/" , dashboardMiddleware.validateDashboardQueryMiddleware, controller.index);

module.exports = router;
