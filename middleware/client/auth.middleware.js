const User = require("../../models/user.model");
const { withActiveUserStatus } = require("../../helpers/active-user-query.helper");
const { client: redisClient, getIsReady: getRedisIsReady } = require("../../config/redis");

const USER_TOKEN_CACHE_TTL_SECONDS = 300;

function getUserTokenCacheKey(tokenUser) {
  return `user:token:${tokenUser}`;
}

function serializeCachedUser(user) {
  if (!user) return null;

  return {
    _id: user._id.toString(),
    fullName: user.fullName || "",
    email: user.email || "",
    avatar: user.avatar || "",
    tokenUser: user.tokenUser || "",
  };
}

async function getCachedUserByToken(tokenUser) {
  if (!tokenUser || !getRedisIsReady()) return null;

  try {
    const cached = await redisClient.get(getUserTokenCacheKey(tokenUser));
    if (!cached) return null;

    return JSON.parse(cached);
  } catch (error) {
    console.warn("[AuthCache] Failed to read user token cache:", error.message);
    return null;
  }
}

async function setCachedUserByToken(tokenUser, user) {
  if (!tokenUser || !user || !getRedisIsReady()) return;

  try {
    await redisClient.setEx(
      getUserTokenCacheKey(tokenUser),
      USER_TOKEN_CACHE_TTL_SECONDS,
      JSON.stringify(serializeCachedUser(user))
    );
  } catch (error) {
    console.warn("[AuthCache] Failed to write user token cache:", error.message);
  }
}

async function deleteCachedUserByToken(tokenUser) {
  if (!tokenUser || !getRedisIsReady()) return;

  try {
    await redisClient.del(getUserTokenCacheKey(tokenUser));
  } catch (error) {
    console.warn("[AuthCache] Failed to delete user token cache:", error.message);
  }
}

async function findUserByToken(tokenUser) {
  const cachedUser = await getCachedUserByToken(tokenUser);
  if (cachedUser) return cachedUser;

  const user = await User
    .findOne(withActiveUserStatus({ tokenUser }))
    .select("_id fullName email avatar tokenUser")
    .lean();

  if (user) {
    await setCachedUserByToken(tokenUser, user);
  }

  return user;
}

// FIX: set session.clientUser để socket có thể xác thực user.
// Socket middleware đọc session.clientUser._id trong getSocketActor() —
// nếu không set thì actor luôn null → mọi socket event bị reject → timeout.
function syncSessionUser(req, user) {
  const serialized = serializeCachedUser(user);

  // Chỉ save session khi clientUser chưa có hoặc _id thay đổi
  // (tránh gọi session.save() thừa mỗi request)
  const current = req.session.clientUser;
  if (!current || current._id !== serialized._id) {
    req.session.clientUser = serialized;
    // Không cần await — session tự flush trước khi response kết thúc
    // nhờ express-session rolling:true + store đã được set
  }
}

function rejectUnauthorized(req, res, fallbackPath = "/user/login") {
  return res.redirect(fallbackPath);
}

function isLogoutRequest(req) {
  return req.originalUrl === "/user/logout" || req.path === "/user/logout";
}

module.exports.requireAuth = async (req, res, next) => {
  if (!req.cookies.tokenUser) {
    return rejectUnauthorized(req, res, "/");
  }

  const user = await findUserByToken(req.cookies.tokenUser);

  if (!user) {
    return rejectUnauthorized(req, res);
  }

  req.user = user;
  res.locals.user = user;
  syncSessionUser(req, user); // ← FIX: ghi vào session cho socket
  next();
};

module.exports.requireAuthCheckOut = async (req, res, next) => {
  if (!req.cookies.tokenUser) {
    req.flash("thatbai", "Vui lòng đăng nhập để thanh toán ");
    return res.redirect("/user/login");
  }

  const user = await findUserByToken(req.cookies.tokenUser);

  if (!user) {
    return rejectUnauthorized(req, res);
  }

  req.user = user;
  res.locals.user = user;
  syncSessionUser(req, user); // ← FIX: ghi vào session cho socket
  next();
};

module.exports.checkUserLogin = async (req, res, next) => {
  if (req.cookies.tokenUser) {
    if (isLogoutRequest(req)) {
      // Xóa session.clientUser khi logout để socket không còn nhận diện được user
      req.session.clientUser = null;
      await deleteCachedUserByToken(req.cookies.tokenUser);
      return next();
    }

    const user = await findUserByToken(req.cookies.tokenUser);

    if (user) {
      req.user = user;
      res.locals.user = user;
      syncSessionUser(req, user); // ← FIX: ghi vào session cho socket
    }
  }

  next();
};

module.exports.deleteCachedUserByToken = deleteCachedUserByToken;
