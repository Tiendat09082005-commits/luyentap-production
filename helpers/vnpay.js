const { VNPay } = require('vnpay');

const paymentUrl = new URL(process.env.VNP_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html");

const vnpay = new VNPay({
    tmnCode: process.env.VNP_TMNCODE,
    secureSecret: process.env.VNP_HASHSECRET,
    vnpayHost: paymentUrl.origin,
    testMode: true, // Cài đặt true để dùng Sandbox
    hashAlgorithm: 'SHA512',
    endpoints: {
        paymentEndpoint: paymentUrl.pathname.replace(/^\//, ""),
        queryDrRefundEndpoint: "merchant_webapi/api/transaction",
        getBankListEndpoint: "qrpayauth/api/merchant/get_bank_list",
    },
});

module.exports = vnpay;
