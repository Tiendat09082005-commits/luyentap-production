const mongoose = require("mongoose");

const validateGetRoles = () => {
    return []; // hiện chưa có query nên return rỗng
};

const validateGetPermissionRoles = () => {
    return []; // hiện chưa có query
};


const validateCreateRole = (body) => {
    const errors = [];

    // title
    if (!body.title || body.title.trim().length === 0) {
        errors.push("Tên nhóm quyền không được để trống");
    }

    if (body.title && body.title.length > 100) {
        errors.push("Tên nhóm quyền quá dài");
    }

    // permissions
    if (body.permissions && !Array.isArray(body.permissions)) {
        errors.push("Permissions phải là mảng");
    }

    if (body.permissions && body.permissions.length > 100) {
        errors.push("Quá nhiều quyền");
    }

    return errors;
};

const validatePermissionPatch = (body) => {
    const errors = [];

    let permissions;

    try {
        permissions = JSON.parse(body.permissions);
    } catch (e) {
        errors.push("Dữ liệu permissions không hợp lệ");
        return errors;
    }

    if (!Array.isArray(permissions)) {
        errors.push("Permissions phải là mảng");
        return errors;
    }

    for (const item of permissions) {
        if (!item.id || !mongoose.Types.ObjectId.isValid(item.id)) {
            errors.push("ID role không hợp lệ");
            break;
        }

        if (!Array.isArray(item.permission)) {
            errors.push("Permission phải là mảng");
            break;
        }
    }

    return errors;
}

const validateGetRoleDetail = (params) => {
    const errors = [];

    if (!params.id) {
        errors.push("Thiếu ID");
    }

    if (params.id && !mongoose.Types.ObjectId.isValid(params.id)) {
        errors.push("ID không hợp lệ");
    }

    return errors;
};


const validateEditRole = (params) => {
    const errors = [];

    if (!params.id) {
        errors.push("Thiếu ID");
    }

    if (params.id && !mongoose.Types.ObjectId.isValid(params.id)) {
        errors.push("ID không hợp lệ");
    }

    return errors;
};


const validateUpdateRole = (params, body) => {
    const errors = [];

    // validate id
    if (!params.id || !mongoose.Types.ObjectId.isValid(params.id)) {
        errors.push("ID không hợp lệ");
    }

    // validate title
    if (body.title !== undefined) {
        if (body.title.trim().length === 0) {
            errors.push("Tên nhóm quyền không hợp lệ");
        }
        if (body.title.length > 100) {
            errors.push("Tên nhóm quyền quá dài");
        }
    }

    // description
    if (body.description && body.description.length > 500) {
        errors.push("Mô tả quá dài");
    }

    return errors;
};


const validateDeleteRole = (params) => {
    const errors = [];

    if (!params.id || !mongoose.Types.ObjectId.isValid(params.id)) {
        errors.push("ID không hợp lệ");
    }

    return errors;
};
module.exports = {
    validateGetRoles,
    validateGetPermissionRoles,
    validateCreateRole,
    validatePermissionPatch,
    validateGetRoleDetail,
    validateEditRole,
    validateUpdateRole,
    validateDeleteRole
};