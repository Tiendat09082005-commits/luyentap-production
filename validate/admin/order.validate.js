const mongoose = require("mongoose");
const { VALID_STATUS } = require("../../services/admin/order.service");

// validate GET /orders
const validateGetOrders = (query) => {
    const errors = [];

    if (query.keyword && query.keyword.length > 100) {
        errors.push("Keyword tối đa 100 ký tự");
    }

    if (query.status && !VALID_STATUS.includes(query.status)) {
        errors.push("Status không hợp lệ");
    }

    if (query.date) {
        const parsed = new Date(query.date);
        if (isNaN(parsed)) {
            errors.push("Date phải đúng format YYYY-MM-DD");
        }
    }

    return errors;
};

//  validate update status
const validateUpdateStatus = (body) => {
    const errors = [];

    if (!body.orderId) {
        errors.push("Thiếu orderId");
    }

    if (body.orderId && !mongoose.Types.ObjectId.isValid(body.orderId)) {
        errors.push("orderId không hợp lệ");
    }

    if (!body.status) {
        errors.push("Thiếu status");
    }

    if (body.status && !VALID_STATUS.includes(body.status)) {
        errors.push("Status không hợp lệ");
    }

    return errors;
};

const validateDeleteOrder = (reqBody) => {
    const errors = [];

    if (!reqBody.id) {
        errors.push("Thiếu ID đơn hàng");
    }

    if (reqBody.id && !mongoose.Types.ObjectId.isValid(reqBody.id)) {
        errors.push("ID không hợp lệ");
    }

    return errors;
};


const validateSuggest = (query) => {
  const errors = [];

  if (!query.keyword || typeof query.keyword !== "string") {
    errors.push("Keyword is required");
  } else if (query.keyword.trim().length < 2) {
    errors.push("Keyword must be at least 2 characters");
  }

  return errors;
};

const validateGetOrderDetail = (query) => {
  const errors = [];

  if (!query.order_id) {
    errors.push("Thiếu order_id");
  }

  return errors;
};

module.exports = {
  validateGetOrders,
  validateUpdateStatus,
  validateDeleteOrder,
  validateSuggest,
  validateGetOrderDetail
};