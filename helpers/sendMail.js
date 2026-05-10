const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const sendMail = async (to, subject, html) => {
  return await transporter.sendMail({
    from: `"My App" <${process.env.MAIL_USER}>`,
    to: to,
    subject: subject,
    html: html,
  });
};

module.exports = sendMail;