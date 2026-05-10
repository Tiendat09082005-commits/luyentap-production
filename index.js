// 1. IMPORT THƯ VIỆN CORE
const express = require('express'); // Framework chính để build web server
const path = require('path'); // Xử lý đường dẫn file
const { createServer } = require('node:http'); // Tạo HTTP server (dùng cho socket)
require('dotenv').config(); // Load biến môi trường từ .env


// 2. IMPORT MIDDLEWARE THƯỜNG DÙNG
const methodOverride = require('method-override'); 
// Cho phép dùng PUT, DELETE trong form (HTML chỉ hỗ trợ GET/POST)

const bodyParser = require('body-parser'); 
// Parse JSON từ request (API)

const cookieParser = require('cookie-parser'); 
// Đọc cookie từ client gửi lên

const session = require('express-session'); 
// Quản lý session (lưu trạng thái đăng nhập)

const flash = require('express-flash'); 
// Hiển thị thông báo (success, error) sau redirect


// 3. SOCKET.IO (REALTIME)
const { Server } = require('socket.io'); 
const socketInit = require('./sockets/index.socket.js'); 
// Xử lý logic socket (chat, realtime,...)


// 4. CONFIG DATABASE & REDIS
const database = require('./config/database.js'); // Kết nối DB
const { connectRedis } = require('./config/redis'); // Kết nối Redis (cache/session)
const paymentMaintenanceService = require('./services/payment-maintenance.service');


// 5. CONFIG KHÁC
const systemConfig = require('./config/system.js'); 

const {
  CATEGORY_ICON_PRESETS,
  DEFAULT_CATEGORY_ICON,
  normalizeCategoryIcon
} = require('./config/category-icons'); 



// 6. MIDDLEWARE CUSTOM
const csrfMiddleware = require("./middleware/csrf"); 
// Bảo vệ CSRF (tránh fake request)

const setLocals  = require("./middleware/setLocals.js"); 
// Set biến global cho view (user, config,...)


// 7. ROUTES
const clientRoute = require('./routes/client/index.route');
const adminRoute = require('./routes/admin/index.route.js');


// 8. KHỞI TẠO APP
const app = express();
const port = Number(process.env.PORT) || 2701;
const isProduction = process.env.NODE_ENV === 'production';


// 9. SESSION CONFIG
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'default_secret', 
  resave: false,
  saveUninitialized: false,
  rolling: true, // Làm mới thời gian sống (maxAge) sau mỗi request
  cookie: {
    maxAge: 1000 * 60 * 60 * 24, // 24 giờ
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction
  }
});

if (isProduction) {
  app.set('trust proxy', 1);
}


// 10. VIEW ENGINE
app.set('view engine', 'pug'); // dùng Pug template
app.set('views', './views');


// 11. GLOBAL MIDDLEWARE (QUAN TRỌNG)
app.use(methodOverride('_method'));
app.use(express.urlencoded({ extended: true })); // parse form data
app.use(bodyParser.json()); // parse JSON
app.use(cookieParser('dat09082005')); // đọc cookie (có secret)


// 12. STATIC FILE
app.use(express.static('public')); // load css, js, image


// 13. APP LOCALS (BIẾN GLOBAL CHO VIEW)
app.locals.prefixAdmin = systemConfig.prefixAdmin;
app.locals.categoryIcons = CATEGORY_ICON_PRESETS;
app.locals.categoryIconPresets = CATEGORY_ICON_PRESETS;
app.locals.defaultCategoryIcon = DEFAULT_CATEGORY_ICON;
app.locals.normalizeCategoryIcon = normalizeCategoryIcon;

// middleware set URL hiện tại cho view
app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.currentUrl = req.originalUrl;
  next();
});


// 14. SESSION + FLASH
// Session + Flash moved up
app.use(sessionMiddleware);
app.use(flash());


// 15. PASSPORT (AUTHENTICATION)
const passport = require('./config/passport');

app.use(passport.initialize()); // khởi tạo
app.use(passport.session()); // dùng session cho login


// 16. STATIC CHO THƯ VIỆN (TINYMCE)
app.use('/tinymce', express.static(path.join(__dirname, 'node_modules', 'tinymce')));


// 17. ROUTES


// 18. GLOBAL MIDDLEWARE (SAU ROUTE)

// CSRF chỉ áp dụng cho admin (bảo mật cao hơn)
app.use('/admin', csrfMiddleware, setLocals, adminRoute);
app.use('/', csrfMiddleware, setLocals, clientRoute);


// 19. SOCKET.IO SETUP
const server = createServer(app);
const io = new Server(server);
app.set('io', io); // Lưu io vào app để dùng trong controller

// share session giữa HTTP và socket
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

socketInit(io);


// 20. BOOTSTRAP SERVER
const bootstrap = async () => {
  await database.connect(); // connect DB
  await connectRedis({ required: process.env.NODE_ENV === 'production' }); // connect Redis
  paymentMaintenanceService.start();

  server.listen(port, () => {
    console.log(`Server chạy tại port ${port}`);
  });
};


// 21. HANDLE ERROR SERVER
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${port} đang được sử dụng`);
    return;
  }

  console.error('Server error:', error.message);
});

// 22. RUN APP
bootstrap().catch((error) => {
  console.error('Application bootstrap failed:', error.message);
  process.exit(1);
});
