const mongoose = require("mongoose");

const validateGetBrands = (query) => {
    const errors = [];

    const allowedStatus = ["", "active", "inactive"];

    if (query.status && !allowedStatus.includes(query.status)) {
        errors.push("Trạng thái không hợp lệ");
    }

    if (query.keyword && query.keyword.length > 50) {
        errors.push("Từ khóa quá dài");
    }

    return errors;
};

const validateCreateBrand = (body) => {
    const errors = [];

    if (!body.title || body.title.trim().length === 0) {
        errors.push("Tên brand không được để trống");
    }

    if (body.title && body.title.length > 100) {
        errors.push("Tên brand quá dài");
    }

    const allowedStatus = ["active", "inactive"];
    if (body.status && !allowedStatus.includes(body.status)) {
        errors.push("Trạng thái không hợp lệ");
    }

    if (body.logo && body.logo.length > 500) {
        errors.push("Logo không hợp lệ");
    }

    return errors;
};



const validateGetBrandDetail = (params) => {
    const errors = [];

    if (!params.id) {
        errors.push("Thiếu ID");
    }

    if (params.id && !mongoose.Types.ObjectId.isValid(params.id)) {
        errors.push("ID không hợp lệ");
    }

    return errors;
};


const validateChangeStatusBrand = (params) => {
    const errors = [];

    const allowedStatus = ["active", "inactive"];

    if (!params.id) {
        errors.push("Thiếu ID");
    }

    if (params.id && !mongoose.Types.ObjectId.isValid(params.id)) {
        errors.push("ID không hợp lệ");
    }

    if (!params.status) {
        errors.push("Thiếu trạng thái");
    }

    if (params.status && !allowedStatus.includes(params.status)) {
        errors.push("Trạng thái không hợp lệ");
    }

    return errors;
};

const validateEditBrand = (params, body) => {
    const errors = [];

    // validate id
    if (!params.id) {
        errors.push("Thiếu ID");
    }

    if (params.id && !mongoose.Types.ObjectId.isValid(params.id)) {
        errors.push("ID không hợp lệ");
    }

    // validate title
    if (body.title !== undefined && body.title.trim().length === 0) {
        errors.push("Tên brand không hợp lệ");
    }

    // validate status
    const allowedStatus = ["active", "inactive"];
    if (body.status && !allowedStatus.includes(body.status)) {
        errors.push("Trạng thái không hợp lệ");
    }

    // validate logo
    if (body.logo && body.logo.length > 500) {
        errors.push("Logo không hợp lệ");
    }

    return errors;
};


const validateDeleteBrand = (params) => {
    const errors = [];

    if (!params.id) {
        errors.push("Thiếu ID");
    }

    if (params.id && !mongoose.Types.ObjectId.isValid(params.id)) {
        errors.push("ID không hợp lệ");
    }

    return errors;
};



module.exports = {
  validateGetBrands,
  validateCreateBrand,
  validateGetBrandDetail,
  validateChangeStatusBrand,
  validateEditBrand,
  validateDeleteBrand
};