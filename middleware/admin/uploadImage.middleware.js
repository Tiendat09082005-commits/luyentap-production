// middlewares/uploadCloud.js

const cloudinary   = require("cloudinary").v2;
        const streamifier  = require("streamifier");
const crypto       = require("crypto");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key:    process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET
});

/* ─────────────────────────────────────────────
   Helper: upload 1 buffer lên Cloudinary
   Trả về secure_url (string)
───────────────────────────────────────────── */
function uploadBuffer(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        transformation: [
          { width: 800, height: 800, crop: "limit" },
          { quality: "auto" },
          { fetch_format: "auto" }
        ]
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

/* ─────────────────────────────────────────────
   Middleware chính – xử lý tất cả req.files
───────────────────────────────────────────── */
module.exports.upload = async (req, res, next) => {
  // Normalize both req.file (single) and req.files (multiple) into a single array
  let filesToUpload = [];
  if (req.files) {
    filesToUpload = Array.isArray(req.files)
      ? req.files
      : Object.values(req.files).flat();
  } else if (req.file) {
    filesToUpload = [req.file];
  }

  if (filesToUpload.length === 0) return next();

  const nonImage = filesToUpload.find(f => !f.mimetype.startsWith("image/"));
  if (nonImage) {
    return res.status(400).send(`File "${nonImage.originalname}" không phải ảnh`);
  }

  try {
    const uploadedHashes = new Map();

    await Promise.all(
      filesToUpload.map(async (file) => {
        const hash = crypto.createHash("md5").update(file.buffer).digest("hex");
        
        let uploadPromise;
        if (uploadedHashes.has(hash)) {
          uploadPromise = uploadedHashes.get(hash);
        } else {
          // Default folder is "products" as per existing logic
          uploadPromise = uploadBuffer(file.buffer, "products");
          uploadedHashes.set(hash, uploadPromise);
        }
        
        const url = await uploadPromise;

        // Decode fieldname carefully
        const field = Buffer.from(file.fieldname, "latin1").toString("utf8");

        if (field === "thumbnail") {
          req.body.thumbnail = url;
          return;
        }

        if (field === "avatar") {
          req.body.avatar = url;
          return;
        }

        if (field === "logo") {
          req.body.logo = url;
          return;
        }

        if (field === "favicon") {
          req.body.favicon = url;
          return;
        }

        if (field === "heroImage") {
          req.body.heroImage = url;
          return;
        }

        if (field === "images") {
          if (!Array.isArray(req.body.images)) req.body.images = [];
          req.body.images.push(url);
          return;
        }

        const variantThumbMatch = field.match(/^variantThumbnail\[(\d+)\]$/);
        if (variantThumbMatch) {
          const idx = parseInt(variantThumbMatch[1]);
          if (req.body.variants && req.body.variants[idx]) {
            req.body.variants[idx].thumbnail = url;
          }
          return;
        }

        const variantImgThumbMatch = field.match(
          /^variantImages\[([^\]]+)\]\[([^\]]+)\]\[thumb\]$/
        );
        if (variantImgThumbMatch) {
          const [, attrCode, val] = variantImgThumbMatch;
          if (!req.body.variantImages)                req.body.variantImages = {};
          if (!req.body.variantImages[attrCode])      req.body.variantImages[attrCode] = {};
          if (!req.body.variantImages[attrCode][val]) req.body.variantImages[attrCode][val] = {};
          req.body.variantImages[attrCode][val].thumb = url;
          return;
        }

        const variantImgGalleryMatch = field.match(
          /^variantImages\[([^\]]+)\]\[([^\]]+)\]\[gallery\]\[\]$/
        );
        if (variantImgGalleryMatch) {
          const [, attrCode, val] = variantImgGalleryMatch;
          if (!req.body.variantImages)                        req.body.variantImages = {};
          if (!req.body.variantImages[attrCode])              req.body.variantImages[attrCode] = {};
          if (!req.body.variantImages[attrCode][val])         req.body.variantImages[attrCode][val] = {};
          if (!req.body.variantImages[attrCode][val].gallery) req.body.variantImages[attrCode][val].gallery = [];
          req.body.variantImages[attrCode][val].gallery.push(url);
          return;
        }
      })
    );

    next();
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    return res.status(500).send("Upload ảnh thất bại");
  }
};
