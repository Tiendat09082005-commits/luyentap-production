# Luyentap Code Review

## Tổng quan

`luyentap` là một ứng dụng web thương mại điện tử dùng:

- `Node.js` + `Express`
- `MongoDB` + `Mongoose`
- `Pug` cho server-side rendering
- `Socket.IO` cho realtime chat
- `Redis` cho cache / rate limit fallback
- `VNPay` cho thanh toán online
- `Passport Google OIDC` cho đăng nhập Google

Codebase đã vượt mức demo cơ bản. Có nhiều tính năng thực tế:

- quản trị sản phẩm, danh mục, thuộc tính, brand, role, account
- giỏ hàng, checkout, đơn hàng
- chat realtime user/admin
- comment có cây trả lời
- cache + rate limit
- tích hợp upload ảnh và thanh toán

Điều đó cho thấy project có chiều sâu triển khai thật, không chỉ là CRUD đơn giản.

---

## Điểm mạnh

### 1. Tách module theo domain khá rõ

Cấu trúc thư mục `controllers / models / routes / middleware / services / helpers / views` tương đối dễ theo dõi. Với một project Express SSR, đây là nền tảng ổn để tiếp tục phát triển.

### 2. Có tư duy backend thực chiến, không chỉ render giao diện

Project đã có các phần thường bị bỏ qua ở đồ án nhỏ:

- `services/cache.service.js`
- `services/rateLimiter.service.js`
- `services/comment.service.js`
- Redis fallback memory khi môi trường local không có Redis
- session bridge sang socket cho chat realtime

Đây là dấu hiệu tốt: tác giả đã nghĩ tới hiệu năng, ổn định và behavior runtime chứ không chỉ làm cho “chạy được”.

### 3. Có nhiều chỗ xử lý business logic tốt hơn mức trung bình

Ví dụ:

- phần comment có normalize content, limit độ sâu reply, rate limit
- phần product có normalize payload cho product/variant
- product create/edit dùng `mongoose` transaction
- checkout có kiểm tra tồn kho lại từ DB trước khi chốt đơn
- VNPay return có verify amount và trạng thái thanh toán

Những điểm này cho thấy code không hoàn toàn “thin controller gọi save”.

### 4. Có ý thức cache invalidation

`cache.service.js` được viết tương đối chỉn chu:

- normalize key
- hash key
- chống duplicate in-flight request
- invalidate theo namespace
- fallback memory nếu Redis unavailable

Đây là một trong các phần chất lượng tốt của repo.

### 5. Giao diện admin/client được đầu tư

Phần `views` và `public` khá dày. Nhiều trang admin có UI riêng thay vì dùng một layout CRUD chung. Điều này tốt cho trải nghiệm người dùng và cho thấy project đã được dùng theo flow thực tế.

---

## Điểm yếu

### 1. Controller quá lớn, đang ôm quá nhiều trách nhiệm

Nhiều controller hiện chứa:

- validation
- query DB
- business rules
- transaction
- flash message
- redirect/render
- transform dữ liệu view

Ví dụ rõ nhất là:

- `controllers/admin/products.controller.js`
- `controllers/client/checkout.controller.js`

Hệ quả:

- khó test
- khó tái sử dụng
- khó review bug
- dễ sinh logic trùng
- sửa một chỗ dễ ảnh hưởng nhiều behavior khác

### 2. Có dấu hiệu code bị lặp và bị “override” ngoài ý muốn

`controllers/admin/products.controller.js` đang khai báo `module.exports.editPatch` hai lần. Hàm phía sau sẽ override hàm phía trước. Đây là một bug cấu trúc nghiêm trọng vì:

- tạo nhiễu khi đọc code
- làm reviewer tưởng có 2 flow khác nhau
- rất dễ sửa nhầm vào hàm không còn hiệu lực

Đây là dấu hiệu project cần refactor controller theo module nhỏ hơn.

### 3. Tính nhất quán chưa cao

Repo hiện đang trộn nhiều style code:

- chỗ dùng `lean()`, chỗ không
- chỗ dùng service layer, chỗ gọi DB trực tiếp từ controller
- chỗ trả JSON chuẩn, chỗ `res.json(404)`
- chỗ có validation riêng, chỗ validate inline
- chỗ đặt tên tiếng Anh, chỗ tiếng Việt, chỗ viết tắt

Ví dụ:

- `models/forgotPassword.mdel.js` bị typo tên file
- `package.json` có dependency `cookieparser` dư / sai chuẩn
- `controllers/client/chat.controller.js` dùng `res.json(404)` thay vì `res.status(404).json(...)`

Những điểm này làm giảm độ tin cậy tổng thể của codebase.

### 4. Nhiều query theo kiểu N+1, khó scale

Một số luồng hiện tại sẽ chậm rõ khi dữ liệu tăng:

- `controllers/admin/message.controller.js`
  vì loop conversation rồi `findOne` latest message từng cái
- `controllers/client/checkout.controller.js`
  vì loop từng cart item rồi query product / variant riêng
- `services/comment.service.js`
  load toàn bộ comment của product rồi mới build tree + paginate trong memory

Ở dữ liệu nhỏ thì ổn. Khi số lượng sản phẩm, comment, conversation tăng, đây sẽ là bottleneck.

### 5. Bảo mật đã cải thiện nhưng chưa đồng đều toàn hệ thống

Điểm tốt là chat đã được harden hơn trước. Tuy vậy, nhìn tổng thể repo vẫn còn các rủi ro:

- auth đang lai giữa cookie token riêng và session bridge
- config session còn khá sơ sài
- thời gian sống session hiện rất ngắn (`maxAge: 60000`)
- cookie/security flags chưa được chuẩn hóa thành một chỗ cấu hình rõ ràng
- nhiều route vẫn dựa mạnh vào redirect/flash hơn là contract rõ ràng

Nói ngắn: có tiến bộ, nhưng security model chưa thật sự thống nhất.

### 6. Thiếu test và tài liệu kỹ thuật

`package.json` chưa có test thật.

Hiện tại repo không có:

- unit test
- integration test
- smoke test cho các flow quan trọng
- tài liệu kiến trúc
- hướng dẫn setup rõ ràng

Với codebase đã khá lớn, đây là thiếu hụt đáng kể.

### 7. Encoding / text quality chưa sạch

Nhiều file có chuỗi tiếng Việt bị lỗi encoding khi đọc trong terminal. Điều này thường kéo theo:

- khó maintain
- khó review PR
- dễ lỗi UI / content
- khó chuẩn hóa i18n về sau

Nên coi đây là technical debt cần dọn sớm.

---

## Điểm cần cải thiện

## Các cải thiện quan trọng cần làm ngay

### 1. Chuẩn hóa security cho toàn bộ request thay đổi dữ liệu

Hiện repo có nhiều route `POST/PATCH/DELETE` nhưng chưa thấy middleware CSRF thực sự, trong khi view lại đã render hidden field `_csrf` ở một số màn admin. Điều này cho thấy intent đã có nhưng implementation chưa hoàn thành.

Các route cần đặc biệt lưu ý:

- `/admin/brands`
- `/admin/products`
- `/admin/attribute`
- `/cart/*`
- `/user/*`
- `/checkout/*`
- `/comments`

Khuyến nghị:

- thêm `csurf` hoặc cơ chế CSRF tương đương cho toàn bộ route SSR state-changing
- không chỉ render hidden `_csrf`, mà phải verify thật ở middleware

### 2. Xóa các GET route đang làm thay đổi state

Một số hành động thay đổi dữ liệu vẫn dùng `GET`, ví dụ:

- `routes/admin/brand.route.js` có `GET /:id/toggle-status`

Đây là anti-pattern vì:

- dễ bị trigger ngoài ý muốn
- khó cache/control
- tăng nguy cơ CSRF

Khuyến nghị:

- chuyển sang `PATCH`
- thêm confirm/action token nếu cần

### 3. Tách các flow payment và order cho rõ hơn

Hiện tồn tại cả:

- `controllers/client/checkout.controller.js::vnpayReturn`
- `controllers/client/payment.controller.js::vnpayReturn`

và các route:

- `/checkout/vnpay-return`
- `/payment/vnpay-return`

Điều này tạo cảm giác trùng flow, dễ gây lệch logic theo thời gian.

Khuyến nghị:

- chỉ giữ một flow canonical cho VNPay return
- tách rõ IPN server-to-server và return browser redirect
- đưa payment state machine vào service riêng

### 4. Chuẩn hóa auth ở route level, không chỉ check trong controller

Ví dụ:

- `routes/client/products.route.js` cho phép `PATCH /favorite/:productId` public
- controller có check `if (!req.user)` rồi trả `401`

Điều này vẫn chạy được, nhưng thiếu defense-in-depth.

Khuyến nghị:

- route cần đăng nhập thì gắn middleware auth ngay ở route
- controller không nên là tuyến phòng thủ duy nhất

### 5. Bổ sung validation còn thiếu ở admin

Hiện `validate/admin/attribute.validate.js` đang rỗng, trong khi create/edit attribute đã cho phép ghi dữ liệu.

Khuyến nghị:

- thêm validate schema cho attribute
- validate cho setting, brand, order status input
- thống nhất validator style cho toàn repo

---

## Chức năng chưa hoàn thiện

### 1. Cài đặt chung admin mới dừng ở phần giao diện

`routes/admin/setting.route.js` hiện chỉ có `GET /` và `controllers/admin/setting.controller.js` chỉ render view.

Điều đó có nghĩa là:

- màn hình settings đã có UI khá đầy đủ
- nhưng chưa có luồng `POST/PATCH` để lưu dữ liệu
- chưa có model/settings persistence rõ ràng
- các hidden field như `_csrf` ở trang này cũng chưa đi tới flow submit hoàn chỉnh

Đây là chức năng đang “xây nửa chừng”.

### 2. Hệ validate admin chưa đồng đều

Một số khu vực đã có validator khá tốt, ví dụ product create/edit. Nhưng ở nhiều feature admin khác:

- brand
- attribute
- setting

validate còn nhẹ hoặc chưa có file hoàn chỉnh.

### 3. README/public docs trước đó gần như chưa có

Repo trước khi bổ sung review này chưa có tài liệu kỹ thuật rõ ràng cho:

- setup môi trường
- biến môi trường bắt buộc
- flow thanh toán
- flow chat
- chiến lược cache

Về mặt vận hành, đây cũng là “chưa hoàn thiện”.

### 4. Test infrastructure chưa hoàn thiện

`package.json` vẫn chưa có test thực sự.

Điều này có nghĩa là các chức năng quan trọng như:

- checkout
- payment IPN
- chat authorization
- comment rate-limit
- product create/edit variant

đều chưa có safety net tự động.

### 5. Một số màn admin có dấu hiệu còn ở mức MVP

Dựa trên code hiện có, các phần sau vẫn mang tính “đủ dùng” hơn là hoàn thiện:

- message admin: realtime có cải thiện, nhưng dữ liệu sidebar và enrich user/conversation còn placeholder khi conversation mới tới
- setting admin: UI mạnh hơn backend
- role/permission/account flow: có chạy được nhưng chuẩn hóa message/error chưa tốt

---

## API / khu vực chưa bảo mật tốt hoặc cần harden thêm

## Mức cao

### 1. Toàn bộ route state-changing SSR hiện chưa thấy CSRF protection thật

Đây là rủi ro lớn nhất ở thời điểm hiện tại.

Biểu hiện:

- view có hidden `_csrf`
- nhưng repo không có middleware `csurf`
- không thấy chỗ sinh và verify token

Tác động:

- các form admin/client thay đổi dữ liệu có thể bị CSRF nếu cookie auth hợp lệ

### 2. Route admin thay đổi trạng thái bằng GET

Ví dụ:

- `GET /admin/brands/:id/toggle-status`

Đây là route nên đổi ngay sang `PATCH/POST`.

## Mức trung bình

### 3. `PATCH /products/favorite/:productId` chưa khóa ở route

Hiện route public, controller mới check `req.user`.

Tác động:

- không phải bypass auth trực tiếp
- nhưng thiếu nhất quán security model
- middleware/logging/rate-limit/auth policy ở route level không áp được rõ ràng

Khuyến nghị:

- thêm `authMiddleware.requireAuth` hoặc middleware JSON auth phù hợp ngay tại route

### 4. `POST /comments` cho phép guest comment

`controllers/client/comment.controller.js` cố ý hỗ trợ guest comment bằng IP-based requester key.

Điều này không sai nếu là business decision, nhưng về bảo mật/chống abuse cần coi là bề mặt tấn công:

- spam comment
- flood bằng IP xoay vòng
- nội dung rác

Điểm tốt:

- đã có rate limit
- có normalize content
- có giới hạn depth/length

Điểm chưa đủ:

- chưa có captcha/challenge
- chưa có moderation flow
- chưa có anti-spam score / shadow-ban

### 5. Chat client response lỗi chưa chuẩn

`controllers/client/chat.controller.js` còn dùng:

- `res.json(404)`

thay vì:

- `res.status(404).json(...)`

Đây không phải lỗ hổng trực tiếp, nhưng là vấn đề API contract. Client và monitoring rất dễ hiểu sai.

### 6. Session config còn yếu cho production

`index.js` hiện có:

- `maxAge: 60000`
- chưa thấy `secure`, `sameSite`, `httpOnly` được chuẩn hóa tại session cookie

Điểm này cần harden thêm theo môi trường production.

## Mức thấp nhưng nên làm

### 7. Logout đang dùng GET

`/user/logout` và `/admin/auth/logout` là GET.

Mức độ không nghiêm trọng như money/state mutation khác, nhưng vẫn nên đổi sang POST để đồng nhất nguyên tắc.

### 8. Một số route admin chưa có permission granularity sâu

Ví dụ `setting` hiện mới chỉ đi qua `authLogin`, chưa thấy `checkPermission(...)` riêng.

Nếu về sau settings tác động tới cấu hình hệ thống thật, nên có permission riêng như:

- `settings_view`
- `settings_edit`

---

## Danh sách việc nên làm theo thứ tự ưu tiên

### Ưu tiên P1

- thêm CSRF protection thật cho toàn bộ form/action SSR
- đổi các route state-changing đang dùng GET sang PATCH/POST
- hợp nhất flow VNPay return/IPN
- sửa các response lỗi chưa chuẩn (`status` + body rõ ràng)

### Ưu tiên P2

- hoàn thiện backend cho trang `admin/setting`
- thêm validator cho brand / attribute / setting
- gắn auth middleware ở route `favorite`
- rà lại các route public ghi dữ liệu

### Ưu tiên P3

- thêm captcha/moderation cho comment guest
- tách payment/order/chat thành service rõ hơn
- bổ sung audit log cho admin action quan trọng

---

## Ưu tiên 1: Ổn định kiến trúc backend

### Việc nên làm

- tách business logic từ controller sang service/use-case
- mỗi controller chỉ nên làm:
  - đọc input
  - gọi service
  - trả response / render
- chia nhỏ `products.controller.js`, `checkout.controller.js`, `user.controller.js`

### Kết quả mong muốn

- code dễ test hơn
- ít bug side effect hơn
- dễ onboarding người mới hơn

---

## Ưu tiên 2: Chuẩn hóa response, validation, error handling

### Việc nên làm

- thống nhất format lỗi JSON
- thay `res.json(404)` bằng status code thật
- gom validation về middleware/service thống nhất
- tạo helper chung cho:
  - success response
  - error response
  - not found
  - forbidden

### Kết quả mong muốn

- API predictable hơn
- client code dễ tích hợp hơn
- log và debug dễ hơn

---

## Ưu tiên 3: Giảm N+1 query và tối ưu hiệu năng

### Việc nên làm

- dùng aggregate/pipeline hoặc preload map dữ liệu thay vì query từng item
- tối ưu message list admin
- tối ưu checkout/cart product lookup
- cân nhắc paginate comment từ DB thay vì build full tree cho mọi request

### Kết quả mong muốn

- response ổn định hơn khi dữ liệu tăng
- giảm áp lực lên MongoDB

---

## Ưu tiên 4: Chuẩn hóa auth và security

### Việc nên làm

- quyết định rõ source of truth cho auth:
  - session-first
  - hoặc token-first
- gom config cookie/session vào một module
- bổ sung các flag phù hợp theo môi trường:
  - `httpOnly`
  - `secure`
  - `sameSite`
- review lại toàn bộ route realtime / payment / order / admin action

### Kết quả mong muốn

- mô hình auth ít chắp vá hơn
- giảm nguy cơ bug bảo mật do flow không nhất quán

---

## Ưu tiên 5: Thiết lập test nền tảng

### Việc nên làm

- thêm test framework (`vitest` hoặc `jest`)
- viết test cho các luồng quan trọng:
  - login/register
  - add to cart
  - checkout/order
  - VNPay return
  - chat authorization
  - comment create/rate limit

### Kết quả mong muốn

- tự tin refactor hơn
- giảm regression khi thêm tính năng

---

## Ưu tiên 6: Dọn technical debt

### Việc nên làm

- xóa dependency thừa
- sửa typo file/folder
- chuẩn hóa naming
- loại bỏ hàm export trùng
- thống nhất `lean()` / query style
- chuẩn hóa encoding UTF-8 cho toàn repo

### Kết quả mong muốn

- repo sạch hơn
- dễ đọc hơn
- giảm bug do nhầm lẫn

---

## Đánh giá theo khía cạnh

### Kiến trúc: 6.5/10

Có phân lớp thư mục rõ, nhưng business logic vẫn còn dồn mạnh vào controller.

### Chất lượng code: 6/10

Có nhiều chỗ làm tốt, nhưng bị kéo xuống bởi duplication, naming chưa nhất quán và controller quá lớn.

### Bảo mật: 6/10

Đã có tiến triển, nhất là ở chat/comment, nhưng toàn hệ thống chưa đồng bộ.

### Khả năng scale: 5.5/10

Mức hiện tại phù hợp project nhỏ đến trung bình. Nếu traffic và data tăng nhanh, sẽ cần tối ưu query và tách service rõ hơn.

### Trải nghiệm phát triển: 5/10

Chưa có test, chưa có README chuẩn, chưa có convention rõ nên onboarding sẽ tốn thời gian.

---

## Đề xuất roadmap 4 giai đoạn

### Giai đoạn 1

- dọn duplicate code
- sửa response status
- chuẩn hóa auth/session config
- fix naming/encoding quan trọng

### Giai đoạn 2

- tách service cho product / checkout / order / chat
- thêm validation chuẩn cho input admin/client

### Giai đoạn 3

- thêm test cho các flow quan trọng
- thêm logging có cấu trúc
- tối ưu query nặng

### Giai đoạn 4

- cân nhắc API layer rõ ràng hơn
- chuẩn hóa frontend asset organization
- tách domain module lớn thành bounded module

---

## Kết luận

Đây là một codebase có tiềm năng và đã có nhiều dấu hiệu của một sản phẩm thực tế:

- nhiều tính năng
- có realtime
- có payment
- có cache/rate limit
- có transaction

Điểm mạnh lớn nhất là project không “mỏng”, có nhiều feature thật. Điểm yếu lớn nhất là kiến trúc đang bị kéo theo tốc độ thêm tính năng, khiến controller ngày càng phình to và logic ngày càng phân tán.

Nếu tiếp tục phát triển lâu dài, ưu tiên số một không nên là thêm feature mới ngay, mà là:

1. chuẩn hóa kiến trúc
2. dọn duplication
3. thêm test nền
4. tối ưu các flow query nặng

Làm được 4 việc đó, codebase sẽ bước từ mức “project chạy tốt” sang mức “codebase có thể maintain lâu dài”.
