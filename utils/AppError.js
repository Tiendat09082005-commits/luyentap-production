class AppError extends Error {
  constructor(statusCode, code, message = null) {
    super(message || code);

    this.statusCode = statusCode;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;