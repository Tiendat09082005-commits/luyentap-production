const multer = require("multer");
module.exports = () =>{
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, "public/upload/"); // thư mục lưu ảnh
        },
        filename: function (req, file, cb) {
            // đặt tên file: thời gian hiện tại + tên gốc
            const uniqueSuffix = Date.now() ;
            cb(null, `${uniqueSuffix}-${file.originalname}`);
        },
    })
    return storage;
}
