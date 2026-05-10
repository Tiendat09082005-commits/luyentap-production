const express = require('express');
const router = express.Router();
const controller = require('../../controllers/api/search.controller');
const authMiddleware = require('../../middleware/admin/auth.middleware');

router.get('/users', authMiddleware.checkPermission('account_view'), controller.searchUsers);
router.get('/users/suggest', authMiddleware.checkPermission('account_view'), controller.suggestUsers);

router.get('/accounts', authMiddleware.checkPermission('account_view'), controller.searchAccounts);
router.get('/accounts/suggest', authMiddleware.checkPermission('account_view'), controller.suggestAccounts);

router.get('/orders', authMiddleware.checkPermission('orders_view'), controller.searchOrders);
router.get('/orders/suggest', authMiddleware.checkPermission('orders_view'), controller.suggestOrders);

module.exports = router;
