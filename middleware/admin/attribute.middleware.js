const { validateGetAttributes ,
        validateCreateAttribute,
        validateDeleteAttribute,
        validateEditAttribute   } = require("../../validate/admin/attribute.validate");

const validateGetAttributesMiddleware = (req, res, next) => {
    const errors = validateGetAttributes(req.query);

    if (errors.length > 0) {
        req.flash("thatbai", errors[0]);
        return res.redirect("back");
    }

    next();
};

const validateCreateAttributeMiddleware = (req, res, next) => {
    const errors = validateCreateAttribute(req.body);

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: errors[0]
        });
    }

    next();
};


const validateDeleteAttributeMiddleware = (req, res, next) => {
    const errors = validateDeleteAttribute(req.params);

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: errors[0]
        });
    }

    next();
};


const validateEditAttributeMiddleware = (req, res, next) => {
    const errors = validateEditAttribute(req.params, req.body);

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: errors[0]
        });
    }

    next();
};


module.exports = {
    validateGetAttributesMiddleware,
    validateCreateAttributeMiddleware,
    validateDeleteAttributeMiddleware,
    validateEditAttributeMiddleware
};