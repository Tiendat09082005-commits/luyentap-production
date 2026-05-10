const express = require('express'); // gọi express vào
const router = express.Router(); // dùng phương thức tạo router trong express 
const controller = require("../../controllers/client/user.controller") ; 
const validate = require("../../validate/client/user.validate");
const passport = require("passport");
const authMiddleware = require("../../middleware/client/auth.middleware");

router.get('/register', controller.register);

router.post('/register', validate.register, controller.registerPost);

router.get('/login', controller.login);

router.post('/login', validate.login, controller.loginPost);

router.post('/logout', controller.logout);

router.get('/forgot-password', controller.forgotPassword);

router.post('/forgot-password/send-otp', controller.sendOTP);

router.post('/forgot-password/reset-password', validate.resetPassword, controller.resetPassword);

router.get('/detail/:id', authMiddleware.requireAuth, controller.detail);
router.post('/edit', authMiddleware.requireAuth, validate.edit, controller.editPost);

router.get("/auth/google",passport.authenticate("google", {scope: ["profile", "email"]}));

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/user/login",
  }),
  (req, res) => {
    res.cookie("tokenUser", req.user.tokenUser, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });

    res.redirect("/");
  }
);



module.exports = router; // exports router home ra