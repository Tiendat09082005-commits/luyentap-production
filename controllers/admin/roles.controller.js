const conFig = require("../../config/system");
const Role = require("../../models/roles.model");
const roleService = require("../../services/admin/role.service")

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

        req.flash("thatbai", "Lỗi tải danh sách quyền");
        res.redirect("back");
    }
};



// [POST] admin/roles/create
module.exports.createPost = async (req, res) => {
    try {
        await roleService.createRole(req.body);

        req.flash("thanhcong", `Bạn đã thêm mới thành công nhóm quyền ${req.body.title}`);

    } catch (error) {
        console.error("CREATE ROLE ERROR:", error);

        if (error.message === "ROLE_DUPLICATE") {
            req.flash("thatbai", "Nhóm quyền đã tồn tại");
        } else {
            req.flash("thatbai", `Bạn thêm nhóm quyền ${req.body.title} thất bại`);
        }
    }

    res.redirect(`${conFig.prefixAdmin}/roles`);
}


// [GET] admin/roles/permission
module.exports.permission = async (req, res) => {
    try {
        const records = await roleService.getRolesPermission();

        res.render("admin/pages/roles/permission", {
            records
        });

    } catch (error) {
        console.error("GET ROLE PERMISSION ERROR:", error);

        req.flash("thatbai", "Lỗi tải phân quyền");
        res.redirect("back");
    }
};

// [PATCH] admin/roles/permission
module.exports.permissionPatch = async (req, res) => {
    try {
        await roleService.updatePermissions(req.body.permissions);

        req.flash("thanhcong", "Cập nhật phân quyền thành công");

    } catch (error) {
        console.error("UPDATE PERMISSION ERROR:", error);

        req.flash("thatbai", "Cập nhật phân quyền thất bại");
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

        if (error.message === "ROLE_NOT_FOUND") {
            req.flash("thatbai", "Không tìm thấy nhóm quyền");
        } else {
            req.flash("thatbai", "Lỗi server");
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

        if (error.message === "ROLE_NOT_FOUND") {
            req.flash("thatbai", "Không tìm thấy nhóm quyền");
        } else {
            req.flash("thatbai", "Lỗi server");
        }

        res.redirect(`${conFig.prefixAdmin}/roles`);
    }
};


// [PATCH] admin/roles/edit/:id
module.exports.editPatch = async (req, res) => {
    try {
        const { id } = req.params;

        await roleService.updateRole(id, req.body);

        req.flash("thanhcong", "Bạn đã cập nhật thành công !!");

    } catch (error) {
        console.error("UPDATE ROLE ERROR:", error);

        if (error.message === "ROLE_NOT_FOUND") {
            req.flash("thatbai", "Không tìm thấy nhóm quyền");
        } else if (error.message === "ROLE_DUPLICATE") {
            req.flash("thatbai", "Tên nhóm quyền đã tồn tại");
        } else {
            req.flash("thatbai", "Đã xảy ra lỗi");
        }
    }

    res.redirect(`${conFig.prefixAdmin}/roles`);
};

// [DELETE] admin/roles/delete/:id
module.exports.delete = async (req, res) => {
    try {
        const { id } = req.params;

        await roleService.deleteRole(id);

        req.flash(
            "thanhcong",
            "Xóa nhóm quyền thành công, đã chuyển vào thùng rác"
        );

    } catch (error) {
        console.error("DELETE ROLE ERROR:", error);

        if (error.message === "ROLE_NOT_FOUND_OR_DELETED") {
            req.flash("thatbai", "Không tìm thấy hoặc đã bị xóa");
        } else {
            req.flash("thatbai", "Xóa nhóm quyền thất bại");
        }
    }

    res.redirect(`${conFig.prefixAdmin}/roles`);
};