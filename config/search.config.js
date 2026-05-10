const Product = require('../models/products.model');
const User = require('../models/user.model');
const Account = require('../models/accounts.model');
const Order = require('../models/order.model');

module.exports = {
  products: {
    model: Product,
    searchFields: ['title', 'description', 'shortDescription'],
    suggestFields: ['title'],
    searchProjection: 'title slug thumbnail shortDescription status createdAt',
    suggestProjection: 'title slug thumbnail',
    defaultFilter: { status: 'active', deleted: false },
    allowedFilters: {
      brand_id: { type: 'objectId' },
      category_id: { type: 'objectId' },
      status: { type: 'enum', values: ['active', 'inactive'] }
    },
    useTextIndex: true,
    minKeywordLength: 1
  },
  users: {
    model: User,
    searchFields: ['fullName', 'email', 'phone'],
    suggestFields: ['fullName', 'email'],
    searchProjection: 'fullName email avatar status createdAt',
    suggestProjection: 'fullName email avatar status',
    defaultFilter: { deleted: false },
    allowedFilters: {
      status: { type: 'string' }
    },
    useTextIndex: true,
    minKeywordLength: 1,
    permission: 'account_view'
  },
  accounts: {
    model: Account,
    searchFields: ['email', 'fullName'],
    suggestFields: ['email', 'fullName'],
    searchProjection: 'fullName email avatar status role_id createdAt',
    suggestProjection: 'fullName email avatar status',
    defaultFilter: { deleted: false },
    allowedFilters: {
      status: { type: 'string' }
    },
    useTextIndex: true,
    minKeywordLength: 1,
    permission: 'account_view'
  },
  orders: {
    model: Order,
    searchFields: ['orderCode', 'userInfo.phone', 'userInfo.fullName'],
    suggestFields: ['orderCode', 'userInfo.phone'],
    searchProjection: 'orderCode totalPrice status paymentStatus createdAt userInfo.fullName userInfo.phone',
    suggestProjection: 'orderCode totalPrice status paymentStatus userInfo.fullName userInfo.phone',
    defaultFilter: { deleted: false },
    allowedFilters: {
      status: { type: 'string' }
    },
    useTextIndex: false,
    minKeywordLength: 1,
    permission: 'orders_view'
  }
};
