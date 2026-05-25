const flashSuccess = (req, message) => {
    req.flash("thanhcong", message);
};

const flashError = (req, message) => {
    req.flash("thatbai", message);
};

module.exports = {
    flashSuccess,
    flashError
};