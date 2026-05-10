const User = require("../../models/user.model");
const Cart = require("../../models/cart.model");

module.exports.checkLogin = async (req, res, next) => {
    const tokenUser = req.cookies.tokenUser;
    if (!tokenUser) {
        req.user = null;
        return next();
    }
    const user = await User.findOne({
        tokenUser: tokenUser,
        deleted: false
    });
    req.user = user || null;
    next();
}
module.exports.countItemInCart = async (req, res, next) => {
    try {
        // console.log(req.user._id.toString());
        let cart = null;

        // ĐÃ ĐĂNG NHẬP
        if (req.user) {
            // console.log(req.user.id);
            cart = await Cart.findOne({
                user_id: req.user.id,
                // deleted: false
            });
            // console.log(cart);
        }
        // CHƯA ĐĂNG NHẬP
        else if (req.cookies.cartId) {
            cart = await Cart.findById(req.cookies.cartId);
        }

        res.locals.itemInCart = cart?.products?.length || 0;

        // console.log("req.user:", req.user?._id);
        // console.log("cart:", cart);
        // console.log("itemInCart:", res.locals.itemInCart);
        next();

    } catch (error) {
        console.error("countItemInCart error:", error);
        res.locals.itemInCart = 0;
        next();
    }
};
