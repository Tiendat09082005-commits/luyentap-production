const Role = require("../../models/roles.model");
const stringStripHtmlHelper = require("../../helpers/string-strip-html");
const paginationHelper =require("../../helpers/pagination"); 


const normalizePermissions = (permissions) => {
    return [
        ...new Set(
            permissions
                .filter(p => typeof p === "string")
                .map(p => p.trim())
                .filter(Boolean)
        )
    ];
};

const getTitleRole = async () => {
    let find = {
        deleted: false,
    }
    const roles = await Role.find(find).select("title").lean();
    return roles;
};

const getRoles = async (query) => {
    const find = { deleted: false };

    //  total record
    const total = await Role.countDocuments(find);

    //  dùng pagination cũ của bạn
    const pagination = paginationHelper(query, total);

    //  query data
    const records = await Role.find(find)
        .select("title description permissions createdAt")
        .sort({ createdAt: -1 })
        .limit(pagination.limit)
        .skip(pagination.skip)
        .lean();

    //  format data
    const formatted = records.map(item => ({
        ...item,
        description: item.description
            ? stringStripHtmlHelper(item.description)
            : "",
        permissionCount: item.permissions?.length || 0
    }));

    return {
        records: formatted,
        pagination
    };
};


const getRolesPermission = async () => {
    const records = await Role.find({ deleted: false })
        .select("title permissions")
        .sort({ createdAt: -1 })
        .lean();

    // chuẩn hoá permissions
    const formatted = records.map(item => ({
        ...item,
        permissions: [...new Set(item.permissions || [])] // remove duplicate
    }));

    return formatted;
};


const createRole = async (data) => {
    try {
        const roleData = {};

        // whitelist + normalize
        roleData.title = data.title.trim();

        if (data.description) {
            roleData.description = data.description.trim();
        }

        // normalize permissions
        if (Array.isArray(data.permissions)) {
            roleData.permissions = [
                ...new Set(
                    data.permissions
                        .filter(p => typeof p === "string")
                        .map(p => p.trim())
                        .filter(Boolean)
                )
            ];
        } else {
            roleData.permissions = [];
        }

        const record = await Role.create(roleData);

        return record;

    } catch (error) {
        if (error.code === 11000) {
            throw new Error("ROLE_DUPLICATE");
        }

        throw error;
    }
};


const updatePermissions = async (rawPermissions) => {
    const permissions = JSON.parse(rawPermissions);

    const operations = permissions.map(item => ({
        updateOne: {
            filter: {
                _id: item.id,
                deleted: false
            },
            update: {
                permissions: normalizePermissions(item.permission)
            }
        }
    }));

    const result = await Role.bulkWrite(operations);

    return result;
};



const getRoleDetail = async (id) => {
    const record = await Role.findOne({
        _id: id,
        deleted: false
    })
    .select("title description permissions createdAt updatedAt")
    .lean();

    if (!record) {
        throw new Error("ROLE_NOT_FOUND");
    }

    return record;
};


const getRoleForEdit = async (id) => {
    const record = await Role.findOne({
        _id: id,
        deleted: false
    })
    .select("title description")
    .lean();

    if (!record) {
        throw new Error("ROLE_NOT_FOUND");
    }

    return record;
};



const updateRole = async (id, data) => {
    try {
        const updateData = {};

        // whitelist field
        if (data.title !== undefined) {
            updateData.title = data.title.trim();
        }

        if (data.description !== undefined) {
            updateData.description = data.description.trim();
        }

        // permissions sẽ có API riêng

        const result = await Role.findOneAndUpdate(
            { _id: id, deleted: false },
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        if (!result) {
            throw new Error("ROLE_NOT_FOUND");
        }

        return result;

    } catch (error) {
        if (error.code === 11000) {
            throw new Error("ROLE_DUPLICATE");
        }

        throw error;
    }
};


const deleteRole = async (id) => {
    const result = await Role.updateOne(
        {
            _id: id,
            deleted: false
        },
        {
            deleted: true,
            deletedAt: new Date()
        }
    );

    if (result.matchedCount === 0) {
        throw new Error("ROLE_NOT_FOUND_OR_DELETED");
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
    deleteRole
};