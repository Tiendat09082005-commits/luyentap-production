const express = require("express");
const path = require("path");
const { createServer } = require("node:http");

require("dotenv").config();

const methodOverride = require("method-override");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("express-flash");
const { Server } = require("socket.io");

const database = require("./config/database.js");
const { client: redisClient, connectRedis, getIsReady: getRedisIsReady } = require("./config/redis");
const paymentMaintenanceService = require("./services/payment-maintenance.service");
const chatCleanupService = require("./services/chat-cleanup.service");
const systemConfig = require("./config/system.js");
const {
  CATEGORY_ICON_PRESETS,
  DEFAULT_CATEGORY_ICON,
  normalizeCategoryIcon,
} = require("./config/category-icons");
const csrfMiddleware = require("./middleware/csrf");
const setLocals = require("./middleware/setLocals.js");
const socketInit = require("./sockets/index.socket.js");
const clientRoute = require("./routes/client/index.route");
const adminRoute = require("./routes/admin/index.route.js");

const app = express();
const port = Number(process.env.PORT) || 2701;
const isProduction = process.env.NODE_ENV === "production";

let sessionMiddleware = null;

function loadRedisStore() {
  try {
    const connectRedisModule = require("connect-redis");
    return connectRedisModule.RedisStore || connectRedisModule.default || connectRedisModule;
  } catch (error) {
    if (isProduction) {
      throw error;
    }

    console.warn("[Session] connect-redis is not installed. Using MemoryStore.");
    return null;
  }
}

function createSessionMiddleware() {
  const sessionOptions = {
    secret: process.env.SESSION_SECRET || "default_secret",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
    },
  };

  const RedisStore = getRedisIsReady() ? loadRedisStore() : null;

  if (RedisStore) {
    sessionOptions.store = new RedisStore({
      client: redisClient,
      prefix: "sess:",
    });
    console.log("[Session] Using RedisStore.");
  } else {
    console.warn("[Session] Using MemoryStore fallback.");
  }

  return session(sessionOptions);
}

if (isProduction) {
  app.set("trust proxy", 1);
}

app.set("view engine", "pug");
app.set("views", "./views");

app.use(methodOverride("_method"));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser("dat09082005"));
app.use(express.static("public"));

app.locals.prefixAdmin = systemConfig.prefixAdmin;
app.locals.categoryIcons = CATEGORY_ICON_PRESETS;
app.locals.categoryIconPresets = CATEGORY_ICON_PRESETS;
app.locals.defaultCategoryIcon = DEFAULT_CATEGORY_ICON;
app.locals.normalizeCategoryIcon = normalizeCategoryIcon;

app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.currentUrl = req.originalUrl;
  next();
});

app.use((req, res, next) => {
  if (!sessionMiddleware) {
    return res.status(503).send("Server is starting...");
  }

  return sessionMiddleware(req, res, next);
});
app.use(flash());

const passport = require("./config/passport");
app.use(passport.initialize());
app.use(passport.session());

app.use("/tinymce", express.static(path.join(__dirname, "node_modules", "tinymce")));

app.use("/admin", (req, res, next) => {
  if (req.headers["content-type"] && req.headers["content-type"].includes("multipart/form-data")) {
    return next();
  }
  return csrfMiddleware(req, res, next);
}, setLocals, adminRoute);
app.use("/", csrfMiddleware, setLocals, clientRoute);

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  },
});
app.set("io", io);

const { ensureDefaultSettings } = require("./services/admin/setting.service");

const bootstrap = async () => {
  await database.connect();
  await ensureDefaultSettings();
  await connectRedis({ required: process.env.NODE_ENV === "production" });
  sessionMiddleware = createSessionMiddleware();
  socketInit(io, sessionMiddleware);
  paymentMaintenanceService.start();
  chatCleanupService.start();

  server.listen(port, () => {
    console.log(`Server chay tai port ${port}`);
  });
};



bootstrap().catch((error) => {
  console.error("Application bootstrap failed:", error.message);
  process.exit(1);
});
