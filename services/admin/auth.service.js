const Account = require("../../models/accounts.model");
const bcrypt = require("bcrypt");
const rateLimiterService = require("../rateLimiter.service");
const { buildAdminSessionUser } = require("../../helpers/admin-session.helper");

const FALLBACK_BCRYPT_HASH = "$2b$10$7EqJtq98hPqEX7fNZaFWoO5NLJ6M6R6G4S6u4xYxWw6Q7QF5Y1YMu";

const loginAdmin = async ({ email, password, rateLimitKey }) => {
    // 1. rate limit
    const rateLimited = await rateLimiterService.isRateLimited(rateLimitKey, 5, 60);
    if (rateLimited) {
        throw new Error("RATE_LIMIT");
    }

    // 2. find user
    const user = await Account.findOne({
        email,
        deleted: false
    })
    .select("fullName email password role_id status")
    .lean();

    // fake hash để chống timing attack
    const passwordToCompare = user?.password || FALLBACK_BCRYPT_HASH;

    const isPasswordValid = await bcrypt.compare(password, passwordToCompare);

    if (!user || !isPasswordValid) {
        throw new Error("INVALID_CREDENTIALS");
    }

    // 3. check status
    if (user.status !== "active") {
        throw new Error("ACCOUNT_INACTIVE");
    }

    // 4. build session user
    const sessionUser = await buildAdminSessionUser(user);

    if (!sessionUser) {
        throw new Error("INVALID_SESSION_USER");
    }

    return sessionUser;
};

module.exports = {
    loginAdmin
};
