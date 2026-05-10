const Account = require("../models/accounts.model");
const Role = require("../models/roles.model");

function normalizeAdminEmail(email = "") {
  return String(email).trim().toLowerCase();
}

function getAdminLoginPath(prefixAdmin) {
  return `${prefixAdmin}/auth/login`;
}

function getAdminDashboardPath(prefixAdmin) {
  return `${prefixAdmin}/dashboard`;
}

async function buildAdminSessionUser(accountOrId) {
  let account = accountOrId;

  if (!account || !account._id) {
    account = await Account.findOne({
      _id: accountOrId,
      deleted: false
    }).select("fullName email role_id status deleted");
  }

  if (!account || account.deleted || account.status !== "active") {
    return null;
  }

  const role = account.role_id
    ? await Role.findOne({
        _id: account.role_id,
        deleted: false
      }).select("title permissions").lean()
    : null;

  return {
    _id: account._id,
    fullName: account.fullName,
    email: normalizeAdminEmail(account.email),
    role_id: account.role_id || null,
    roles: role || { title: "", permissions: [] }
  };
}

module.exports = {
  normalizeAdminEmail,
  getAdminLoginPath,
  getAdminDashboardPath,
  buildAdminSessionUser
};
