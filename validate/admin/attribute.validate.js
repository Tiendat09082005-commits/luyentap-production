// validate/admin/attribute.validate.js

const validateCreateAttribute = (body) => {
    const errors = [];

    if (!body.title || body.title.trim().length === 0) {
        errors.push("Tiêu đề không được để trống");
    }

    if (!body.code || body.code.trim().length === 0) {
        errors.push("Code không được để trống");
    }

    const allowedStatus = ["active", "inactive"];
    if (body.status && !allowedStatus.includes(body.status)) {
        errors.push("Trạng thái không hợp lệ");
    }

    if (body.values && body.values.length > 500) {
        errors.push("Values quá dài");
    }

    return errors;
};


const validateGetAttributes = (query) => {
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

const validateDeleteAttribute = (params) => {
    const errors = [];

    if (!params.slug || params.slug.trim().length === 0) {
        errors.push("Slug không hợp lệ");
    }

    if (params.slug && params.slug.length > 200) {
        errors.push("Slug quá dài");
    }

    return errors;
};

const validateEditAttribute = (params, body) => {
    const errors = [];

    // slug
    if (!params.slug || params.slug.trim().length === 0) {
        errors.push("Slug không hợp lệ");
    }

    // title
    if (body.title && body.title.trim().length === 0) {
        errors.push("Tiêu đề không hợp lệ");
    }

    // code
    if (body.code && body.code.trim().length === 0) {
        errors.push("Code không hợp lệ");
    }

    // status
    const allowedStatus = ["active", "inactive"];
    if (body.status && !allowedStatus.includes(body.status)) {
        errors.push("Trạng thái không hợp lệ");
    }

    // values
    if (body.values && body.values.length > 500) {
        errors.push("Values quá dài");
    }

    return errors;
};


module.exports = {
  validateCreateAttribute,
  validateGetAttributes,
  validateDeleteAttribute,
  validateEditAttribute
};