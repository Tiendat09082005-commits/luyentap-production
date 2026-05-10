const mongoose = require("mongoose");

const validateCreateAccount = (data) => {
    const errors = [];

    if (!data.email) {
        errors.push("Email không được để trống");
    }

    if (!data.password) {
        errors.push("Password không được để trống");
    }

    if (data.password && data.password.length < 6) {
        errors.push("Password phải >= 6 ký tự");
    }

    return errors;
};

const validateEditAccountGet = (params) => {
    const errors = [];

    if (!params.id) {
        errors.push("Thiếu ID");
    }

    if (params.id && !mongoose.Types.ObjectId.isValid(params.id)) {
        errors.push("ID không hợp lệ");
    }

    return errors;
};

const validateEditAccountPatch = (params, body) => {
    const errors = [];

    if (!params.id) {
        errors.push("Thiếu ID");
    }

    if (params.id && !mongoose.Types.ObjectId.isValid(params.id)) {
        errors.push("ID không hợp lệ");
    }

    if (!body.email) {
        errors.push("Email không được để trống");
    }

    if (body.password && body.password.length < 6) {
        errors.push("Password phải >= 6 ký tự");
    }

    return errors;
};


const validateAccountUser = (query) => {
    const errors = [];
    const allowedStatus = ["", "active", "inactive", "deleted"];

    if (query.status && !allowedStatus.includes(query.status)) {
        errors.push("Trạng thái không hợp lệ");
    }

    if (query.keyword && query.keyword.length > 50) {
        errors.push("Từ khóa quá dài");
    }

    return errors;
};

const validateChangeStatusUser = (params) => {
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


const validateDeleteUser = (params) => {
    const errors = [];

    if (!params.id) {
        errors.push("Thiếu ID");
    }

    if (params.id && !mongoose.Types.ObjectId.isValid(params.id)) {
        errors.push("ID không hợp lệ");
    }

    return errors;
};


const validateRestoreUser = (params) => {
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
    validateCreateAccount,
    validateEditAccountGet,
    validateEditAccountPatch,
    validateAccountUser,
    validateChangeStatusUser,
    validateDeleteUser,
    validateRestoreUser
};