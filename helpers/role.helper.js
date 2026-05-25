const normalizePermissions = (permissions) => {
    if (!Array.isArray(permissions)) {
        return [];
    }
    return [
        ...new Set(
            permissions
                .filter(p => typeof p === "string")
                .map(p => p.trim())
                .filter(Boolean)
        )
    ];
};

const normalizeRoleData = (data) => {
    const roleData = {};

    if (data.title !== undefined) {
        roleData.title = data.title.trim();
    }

    if (data.description !== undefined) {
        roleData.description = data.description.trim();
    }

    if (data.permissions !== undefined) {
        roleData.permissions = normalizePermissions(data.permissions);
    }

    return roleData;
};

module.exports = {
    normalizePermissions,
    normalizeRoleData
};
