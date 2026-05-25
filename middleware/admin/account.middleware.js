const { validateCreateAccount , 
        validateEditAccountGet , 
        validateEditAccountPatch , 
        validateAccountUser,
        validateChangeStatusUser,
        validateDeleteUser,
        validateRestoreUser      } = require("../../validate/admin/account.validate");
const mongoose = require("mongoose");
const conFig = require("../../config/system");
const flash = require("../../helpers/flash.helper");

const validateCreate = (req, res, next) => {
    const errors = validateCreateAccount(req.body);

    if (errors.length > 0) {
        flash.flashError(req, errors[0]);
        return res.redirect(`${conFig.prefixAdmin}/accounts`);
    }

    next();
};

const validateEditGet = (req, res, next) => {
    const errors = validateEditAccountGet(req.params);

    if (errors.length > 0) {
        flash.flashError(req, errors[0]);
        return res.redirect(`${conFig.prefixAdmin}/accounts`);
    }

    next();
};

const validateEditPatch = (req, res, next) => {
    const errors = validateEditAccountPatch(req.params, req.body);

    if (errors.length > 0) {
        flash.flashError(req, errors[0]);
        return res.redirect(`${conFig.prefixAdmin}/accounts`);
    }

    next();
};

const validateDetail = (req, res, next) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        flash.flashError(req, "ID không hợp lệ");
        return res.redirect("back");
    }

    next();
};

const validateAccountUserMiddleware = (req, res, next) => {
    const errors = validateAccountUser(req.query);

    if (errors.length > 0) {
        flash.flashError(req, errors[0]);
        return res.redirect("back");
    }

    next();
};

const validateChangeStatusUserMiddleware = (req, res, next) => {
    const errors = validateChangeStatusUser(req.params);

    if (errors.length > 0) {
        flash.flashError(req, errors[0]);
        return res.redirect(`${conFig.prefixAdmin}/accounts/user`);
    }

    next();
};


const validateDeleteUserMiddleware = (req, res, next) => {
    const errors = validateDeleteUser(req.params);

    if (errors.length > 0) {
        flash.flashError(req, errors[0]);
        return res.redirect(`${conFig.prefixAdmin}/accounts/user`);
    }

    next();
};


const validateRestoreUserMiddleware = (req, res, next) => {
    const errors = validateRestoreUser(req.params);

    if (errors.length > 0) {
        flash.flashError(req, errors[0]);
        return res.redirect(`${conFig.prefixAdmin}/accounts/user`);
    }

    next();
};


module.exports = {
    validateCreate,
    validateEditGet,
    validateEditPatch,
    validateDetail,
    validateAccountUserMiddleware,
    validateChangeStatusUserMiddleware,
    validateDeleteUserMiddleware,
    validateRestoreUserMiddleware
};