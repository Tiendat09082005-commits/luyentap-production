const { validateGetRoles , 
        validateGetPermissionRoles,
        validateCreateRole,
        validatePermissionPatch,
        validateGetRoleDetail ,
        validateEditRole ,
        validateUpdateRole ,
        validateDeleteRole    } = require("../../validate/admin/role.validate");
const conFig = require("../../config/system");
const flash = require("../../helpers/flash.helper");

const validateGetRolesMiddleware = (req, res, next) => {
    const errors = validateGetRoles(req.query);

    if (errors.length > 0) {
        flash.flashError(req, errors[0]);
        return res.redirect("back");
    }

    next();
};



const validateGetPermissionRolesMiddleware = (req, res, next) => {
    const errors = validateGetPermissionRoles(req.query);

    if (errors.length > 0) {
        flash.flashError(req, errors[0]);
        return res.redirect("back");
    }

    next();
};

const validateCreateRoleMiddleware = (req, res, next) => {
    const errors = validateCreateRole(req.body);

    if (errors.length > 0) {
        flash.flashError(req, errors[0]);
        return res.redirect("back");
    }

    next();
}

const validatePermissionPatchMiddleware = (req, res, next) => {
    const errors = validatePermissionPatch(req.body);

    if (errors.length > 0) {
        flash.flashError(req, errors[0]);
        return res.redirect("back");
    }

    next();
};



const validateGetRoleDetailMiddleware = (req, res, next) => {
    const errors = validateGetRoleDetail(req.params);

    if (errors.length > 0) {
        flash.flashError(req, errors[0]);
        return res.redirect(`${conFig.prefixAdmin}/roles`);
    }

    next();
};


const validateEditRoleMiddleware = (req, res, next) => {
    const errors = validateEditRole(req.params);

    if (errors.length > 0) {
        flash.flashError(req, errors[0]);
        return res.redirect(`${conFig.prefixAdmin}/roles`);
    }

    next();
};



const validateUpdateRoleMiddleware = (req, res, next) => {
    const errors = validateUpdateRole(req.params, req.body);

    if (errors.length > 0) {
        flash.flashError(req, errors[0]);
        return res.redirect("back");
    }

    next();
};


const validateDeleteRoleMiddleware = (req, res, next) => {
    const errors = validateDeleteRole(req.params);

    if (errors.length > 0) {
        flash.flashError(req, errors[0]);
        return res.redirect(`${conFig.prefixAdmin}/roles`);
    }

    next();
};

module.exports = {
    validateGetRolesMiddleware,
    validateGetPermissionRolesMiddleware,
    validateCreateRoleMiddleware,
    validatePermissionPatchMiddleware,
    validateGetRoleDetailMiddleware,
    validateEditRoleMiddleware,
    validateUpdateRoleMiddleware,
    validateDeleteRoleMiddleware
};