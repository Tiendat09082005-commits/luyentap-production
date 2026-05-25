const bcrypt = require("bcrypt");
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS, 10) || 10;

const hashPassword = async (password) => {
    return bcrypt.hash(password, SALT_ROUNDS);
};

const normalizeAccountData = async (data) => {
    const accountData = {};

    if (data.email !== undefined) {
        accountData.email = data.email.trim().toLowerCase();
    }

    if (data.fullName !== undefined) {
        accountData.fullName = data.fullName.trim();
    }

    if (data.role_id !== undefined && data.role_id !== "") {
        accountData.role_id = data.role_id;
    }

    if (data.avatar !== undefined && data.avatar !== "") {
        accountData.avatar = data.avatar.trim();
    }

    if (data.password !== undefined && data.password.trim() !== "") {
        accountData.password = await hashPassword(data.password);
    }

    return accountData;
};

module.exports = {
    hashPassword,
    normalizeAccountData
};
