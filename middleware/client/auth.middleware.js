const User = require("../../models/user.model");

// QUAN TRỌNG: Dùng session.clientUser (KHÔNG phải session.user)
// session.user được admin middleware sử dụng riêng
// Nếu dùng chung key → client middleware sẽ xóa session admin khi mở tab client
function setSessionUser(req, user) {
    if (!req.session) return;

    req.session.clientUser = {
        _id: user._id.toString(),
        role: "user"
    };
}

function clearSessionUser(req) {
    if (!req.session?.clientUser) return;
    delete req.session.clientUser;
}
module.exports.requireAuth = async (req,res,next) =>{
    // console.log("chạy qua đây");
    // console.log(req.cookies.token);
    if(!req.cookies.tokenUser){
        clearSessionUser(req);
        res.redirect(`/`);
    }else{
        // console.log(req.cookies.token);
        const user = await User.findOne({tokenUser : req.cookies.tokenUser}).select("-password");
        // console.log(user);
        if(!user){
           clearSessionUser(req);
           res.redirect(`/user/login`); 
        }else{
            setSessionUser(req, user);
            req.user = user;
            res.locals.user = user;
            next();
        }
    }
}
module.exports.requireAuthCheckOut = async (req,res,next) =>{
    // console.log("chạy qua đây");
    // console.log(req.cookies.token);
    if(!req.cookies.tokenUser){
        clearSessionUser(req);
        req.flash("thatbai", "Vui lòng đăng nhập để thanh toán ")
        res.redirect(`/user/login`); 
    }else{
        // console.log(req.cookies.token);
        const user = await User.findOne({tokenUser : req.cookies.tokenUser}).select("-password");
        // console.log(user);
        if(!user){
           clearSessionUser(req);
           res.redirect(`/user/login`); 
        }else{
            setSessionUser(req, user);
            req.user = user;
            res.locals.user = user;
            next();
        }
    }
}
module.exports.checkUserLogin = async (req, res, next) => {
    if (req.cookies.tokenUser) {
        const user = await User
            .findOne({ tokenUser: req.cookies.tokenUser })
            .select("-password");

        if (user) {
            setSessionUser(req, user);
            req.user = user;          // 🔥 DÒNG QUYẾT ĐỊNH
            res.locals.user = user;
        } else {
            clearSessionUser(req);
        }
    } else {
        clearSessionUser(req);
    }
    next();
};


