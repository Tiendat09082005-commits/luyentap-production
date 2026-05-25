const conFig = require("../../config/system");
const roleService = require("../../services/admin/role.service");
const flash = require("../../helpers/flash.helper");
const ERROR_CODE = require("../../constants/error-code");

// [GET] admin/roles
module.exports.index = async (req, res) => {
    try {
        const { records, pagination } =
            await roleService.getRoles(req.query);

        res.render("admin/pages/roles/index", {
            records,
            pagination
        });

    } catch (error) {
        console.error("GET ROLES ERROR:", error);

        flash.flashError(req, "Lỗi tải danh sách quyền");
        res.redirect("back");
    }
};

// [POST] admin/roles/create
module.exports.createPost = async (req, res) => {
    try {
        await roleService.createRole(req.body);

        flash.flashSuccess(req, `Bạn đã thêm mới thành công nhóm quyền ${req.body.title}`);

    } catch (error) {
        console.error("CREATE ROLE ERROR:", error);

        if (error.code === ERROR_CODE.ROLE_DUPLICATE) {
            flash.flashError(req, "Nhóm quyền đã tồn tại");
        } else {
            flash.flashError(req, `Bạn thêm nhóm quyền ${req.body.title} thất bại`);
        }
    }

    res.redirect(`${conFig.prefixAdmin}/roles`);
};

// [GET] admin/roles/permission
module.exports.permission = async (req, res) => {
    try {
        const records = await roleService.getRolesPermission();

        res.render("admin/pages/roles/permission", {
            records
        });

    } catch (error) {
        console.error("GET ROLE PERMISSION ERROR:", error);

        flash.flashError(req, "Lỗi tải phân quyền");
        res.redirect("back");
    }
};

// [PATCH] admin/roles/permission
module.exports.permissionPatch = async (req, res) => {
    try {
        await roleService.updatePermissions(req.body.permissions);

        flash.flashSuccess(req, "Cập nhật phân quyền thành công");

    } catch (error) {
        console.error("UPDATE PERMISSION ERROR:", error);

        flash.flashError(req, "Cập nhật phân quyền thất bại");
    }

    res.redirect(`${conFig.prefixAdmin}/roles/permission`);
};

// [GET] admin/roles/detail/:id
module.exports.detail = async (req, res) => {
    try {
        const { id } = req.params;

        const record = await roleService.getRoleDetail(id);

        res.render("admin/pages/roles/detail", {
            record
        });

    } catch (error) {
        console.error("GET ROLE DETAIL ERROR:", error);

        if (error.code === ERROR_CODE.ROLE_NOT_FOUND) {
            flash.flashError(req, "Không tìm thấy nhóm quyền");
        } else {
            flash.flashError(req, "Lỗi server");
        }

        res.redirect(`${conFig.prefixAdmin}/roles`);
    }
};

// [GET] admin/roles/edit/:id
module.exports.edit = async (req, res) => {
    try {
        const { id } = req.params;

        const record = await roleService.getRoleForEdit(id);

        res.render("admin/pages/roles/edit", {
            record
        });

    } catch (error) {
        console.error("GET ROLE EDIT ERROR:", error);

        if (error.code === ERROR_CODE.ROLE_NOT_FOUND) {
            flash.flashError(req, "Không tìm thấy nhóm quyền");
        } else {
            flash.flashError(req, "Lỗi server");
        }

        res.redirect(`${conFig.prefixAdmin}/roles`);
    }
};

// [PATCH] admin/roles/edit/:id
module.exports.editPatch = async (req, res) => {
    try {
        const { id } = req.params;

        await roleService.updateRole(id, req.body);

        flash.flashSuccess(req, "Bạn đã cập nhật thành công !!");

    } catch (error) {
        console.error("UPDATE ROLE ERROR:", error);

        if (error.code === ERROR_CODE.ROLE_NOT_FOUND) {
            flash.flashError(req, "Không tìm thấy nhóm quyền");
        } else if (error.code === ERROR_CODE.ROLE_DUPLICATE) {
            flash.flashError(req, "Tên nhóm quyền đã tồn tại");
        } else {
            flash.flashError(req, "Đã xảy ra lỗi");
        }
    }

    res.redirect(`${conFig.prefixAdmin}/roles`);
};

// [DELETE] admin/roles/delete/:id
module.exports.delete = async (req, res) => {
    try {
        const { id } = req.params;

        await roleService.deleteRole(id);

        flash.flashSuccess(
            req,
            "Xóa nhóm quyền thành công, đã chuyển vào thùng rác"
        );

    } catch (error) {
        console.error("DELETE ROLE ERROR:", error);

        if (error.code === ERROR_CODE.ROLE_NOT_FOUND_OR_DELETED) {
            flash.flashError(req, "Không tìm thấy hoặc đã bị xóa");
        } else {
            flash.flashError(req, "Xóa nhóm quyền thất bại");
        }
    }

    res.redirect(`${conFig.prefixAdmin}/roles`);
};