const { validateGetBrands ,
        validateCreateBrand,
        validateGetBrandDetail ,
        validateChangeStatusBrand,
        validateEditBrand ,
        validateDeleteBrand    } = require("../../validate/admin/brand.validate");


const validateGetBrandsMiddleware = (req, res, next) => {
    const errors = validateGetBrands(req.query);

    if (errors.length > 0) {
        req.flash("thatbai", errors[0]);
        return res.redirect("back");
    }

    next();
};

const validateCreateBrandMiddleware = (req, res, next) => {
    const errors = validateCreateBrand(req.body);

    if (errors.length > 0) {
        req.flash("thatbai", errors[0]);
        return res.redirect("back");
    }

    next();
};

const validateGetBrandDetailMiddleware = (req, res, next) => {
    const errors = validateGetBrandDetail(req.params);

    if (errors.length > 0) {
        req.flash("error", errors[0]);
        return res.redirect(`${conFig.prefixAdmin}/brands`);
    }

    next();
};

const validateChangeStatusBrandMiddleware = (req, res, next) => {
    const errors = validateChangeStatusBrand(req.params);

    if (errors.length > 0) {
        req.flash("thatbai", errors[0]);
        return res.redirect(`${conFig.prefixAdmin}/brands`);
    }

    next();
};


const validateEditBrandMiddleware = (req, res, next) => {
    const errors = validateEditBrand(req.params, req.body);

    if (errors.length > 0) {
        req.flash("thatbai", errors[0]);
        return res.redirect("back");
    }

    next();
};


const validateDeleteBrandMiddleware = (req, res, next) => {
    const errors = validateDeleteBrand(req.params);

    if (errors.length > 0) {
        req.flash("thatbai", errors[0]);
        return res.redirect(`${systemConfig.prefixAdmin}/brands`);
    }

    next();
};


module.exports = {
    validateGetBrandsMiddleware,
    validateCreateBrandMiddleware,
    validateGetBrandDetailMiddleware,
    validateChangeStatusBrandMiddleware ,
    validateEditBrandMiddleware,
    validateDeleteBrandMiddleware
};