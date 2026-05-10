const crypto = require("crypto");
const qs = require("qs");
const config = require("../config/vnpay");

function sortObject(obj) {
  let sorted = {};
  let keys = Object.keys(obj).sort();
  for (let key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
}

module.exports.verifyVNPay = (vnp_Params) => {
  const secureHash = vnp_Params["vnp_SecureHash"];

  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  const sortedParams = sortObject(vnp_Params);

  const signData = qs.stringify(sortedParams, { encode: false });

  const hmac = crypto.createHmac("sha512", config.vnp_HashSecret);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  return secureHash === signed;
};