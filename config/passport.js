const passport = require("passport");
const GoogleStrategy = require("passport-google-oidc").Strategy;
const User = require("../models/user.model");

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:2701/user/auth/google/callback",
      scope: ["profile", "email"],
    },
    async function verify(issuer, profile, cb) {
      try {
        // console.log("=== GOOGLE PROFILE ===");
        // console.log(profile);

        const email = profile.emails?.[0]?.value;
        const avatar = profile.photos?.[0]?.value;
        const googleId = profile.id;
        const fullName = profile.displayName;

        let user = await User.findOne({
          $or: [{ googleId }, { email }],
        });

        // console.log(user);
        if (!user) {
          user = await User.create({
            fullName,
            email,
            avatar,
            googleId,
            loginType: "google",
          });
        } else {
          // nếu user đã tồn tại bằng email thường thì gắn thêm googleId
          if (!user.googleId) {
            user.googleId = googleId;
            user.avatar = avatar || user.avatar;
            user.loginType = "google";
            await user.save();
          }
        }

        return cb(null, user);
      } catch (error) {
        return cb(error);
      }
    },
  ),
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;
