const cloudinary = require("../../config/cloudinary");
const multer = require("multer");
const streamifier = require("streamifier");

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const FILE_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/zip",
  "application/x-zip-compressed",
]);

const IMAGE_MAX_SIZE = 5 * 1024 * 1024;
const FILE_MAX_SIZE = 10 * 1024 * 1024;
const UPLOAD_FIELD_NAME = "file";

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (!getChatUploadType(file.mimetype)) {
      return cb(new Error("Unsupported file type"));
    }

    return cb(null, true);
  },
  limits: {
    // Multer enforces a hard 10MB cap for every upload; validateChatFile adds the stricter 5MB cap for images.
    fileSize: FILE_MAX_SIZE,
    files: 1,
  },
});

function getChatUploadType(mimetype) {
  if (IMAGE_MIME_TYPES.has(mimetype)) return "image";
  if (FILE_MIME_TYPES.has(mimetype)) return "file";
  return null;
}

function validateChatFile(file) {
  if (!file) {
    const error = new Error("File is required");
    error.status = 400;
    throw error;
  }

  const type = getChatUploadType(file.mimetype);
  if (!type) {
    const error = new Error("Unsupported file type");
    error.status = 400;
    throw error;
  }

  const maxSize = type === "image" ? IMAGE_MAX_SIZE : FILE_MAX_SIZE;
  if (file.size > maxSize) {
    const error = new Error(type === "image" ? "Image must be 5MB or smaller" : "File must be 10MB or smaller");
    error.status = 400;
    throw error;
  }

  return type;
}

function uploadBufferToCloudinary(file, type) {
  const folder = type === "image" ? "chat/images" : "chat/files";
  const resourceType = type === "image" ? "image" : "raw";

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
}

function handleMulterUpload(req, res, next) {
  upload.single(UPLOAD_FIELD_NAME)(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        message: error.code === "LIMIT_FILE_SIZE" ? "File must be 10MB or smaller" : error.message,
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || "Invalid upload",
    });
  });
}

async function uploadChatFile(req, res) {
  try {
    const type = validateChatFile(req.file);
    const result = await uploadBufferToCloudinary(req.file, type);

    return res.status(200).json({
      success: true,
      url: result.secure_url,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      type,
    });
  } catch (error) {
    console.error("[ChatUpload] Upload failed:", error.message);
    return res.status(error.status || 500).json({
      success: false,
      message: error.message || "Upload failed",
    });
  }
}

module.exports = {
  handleMulterUpload,
  uploadChatFile,
};
