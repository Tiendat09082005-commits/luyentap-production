const {
  normalizePermissions,
  normalizeRoleData,
} = require("../../helpers/role.helper");
const RoleReponsitory = require("../../repositories/admin/role.reponsitory");
const stringStripHtmlHelper = require("../../helpers/string-strip-html");
const paginationHelper = require("../../helpers/pagination");
const AppError = require("../../utils/AppError");
const ERROR_CODE = require("../../constants/error-code");

const getTitleRole = async () => {
  const find = {
    deleted: false,
  };
  const roles = await RoleReponsitory.find(find, "title");
  return roles;
};

const getRoles = async (query) => {
  const find = { deleted: false };

  // total record
  const total = await RoleReponsitory.countDocuments(find);

  // dùng pagination cũ
  const pagination = paginationHelper(query, total);

  // query data
  const records = await RoleReponsitory.findPaginated(
    find,
    pagination,
    "title description permissions createdAt"
  );

  // format data
  const formatted = records.map((item) => ({
    ...item,
    description: item.description
      ? stringStripHtmlHelper(item.description)
      : "",
    permissionCount: item.permissions?.length || 0,
  }));

  return {
    records: formatted,
    pagination,
  };
};

const getRolesPermission = async () => {
  const records = await RoleReponsitory.find(
    { deleted: false },
    "title permissions"
  );

  // chuẩn hoá permissions
  const formatted = records.map((item) => ({
    ...item,
    permissions: [...new Set(item.permissions || [])], // remove duplicate
  }));

  return formatted;
};

const createRole = async (data) => {
  try {
    const roleData = normalizeRoleData(data);
    const record = await RoleReponsitory.create(roleData);
    return record;
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError(409, ERROR_CODE.ROLE_DUPLICATE);
    }

    throw error;
  }
};

const updatePermissions = async (rawPermissions) => {
  const permissions = JSON.parse(rawPermissions);

  const operations = permissions.map((item) => ({
    updateOne: {
      filter: {
        _id: item.id,
        deleted: false,
      },
      update: {
        permissions: normalizePermissions(item.permission),
      },
    },
  }));

  const result = await RoleReponsitory.bulkWrite(operations);

  return result;
};

const getRoleDetail = async (id) => {
  const record = await RoleReponsitory.findOne(
    {
      _id: id,
      deleted: false,
    },
    "title description permissions createdAt updatedAt"
  );

  if (!record) {
    throw new AppError(404, ERROR_CODE.ROLE_NOT_FOUND);
  }

  return record;
};

const getRoleForEdit = async (id) => {
  const record = await RoleReponsitory.findOne(
    {
      _id: id,
      deleted: false,
    },
    "title description"
  );

  if (!record) {
    throw new AppError(404, ERROR_CODE.ROLE_NOT_FOUND);
  }

  return record;
};

const updateRole = async (id, data) => {
  try {
    const updateData = normalizeRoleData(data);

    const result = await RoleReponsitory.update({ _id: id }, updateData);

    if (!result) {
      throw new AppError(404, ERROR_CODE.ROLE_NOT_FOUND);
    }

    return result;
  } catch (error) {
    if (error.code === 11000) {
      throw new AppError(409, ERROR_CODE.ROLE_DUPLICATE);
    }

    throw error;
  }
};

const deleteRole = async (id) => {
  const result = await RoleReponsitory.softDelete({ _id: id });

  if (result.matchedCount === 0) {
    throw new AppError(404, ERROR_CODE.ROLE_NOT_FOUND_OR_DELETED);
  }

  return true;
};

module.exports = {
  getRoles,
  getTitleRole,
  getRolesPermission,
  createRole,
  updatePermissions,
  getRoleDetail,
  getRoleForEdit,
  updateRole,
  deleteRole,
};