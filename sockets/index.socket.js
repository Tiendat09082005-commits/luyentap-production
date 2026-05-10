const chatSocket = require("./chat.socket");

module.exports = (io) => {
  chatSocket(io);
};