const Account = require("../../models/accounts.model");
const conFig = require("../../config/system");
const Role = require("../../models/roles.model");
const bcrypt = require('bcrypt');
const saltRounds = 10;
const User = require("../../models/user.model");
const cacheService = require("../../services/cache.service");
const accountService = require("../../services/admin/account.service");
const roleService = require("../../services/admin/role.service");
const filterStatusHelper = require("../../helpers/filterStatus");
const searchHelper = require("../../helpers/search");

const invalidateAccountSearchCache = async () => {
    await Promise.all([
        cacheService.invalidateSearchModel("Account"),
        cacheService.invalidateSearchModel("User")
    ]);
};
// [GET] admin/accounts/
module.exports.index = async (req, res, next) => {
    try {
        const data = await accountService.getAccounts(req.query);
        res.render("admin/pages/account/index", data);
    } catch (error) {
        next(error);
    }
};


// [GET] admin/accounts/create
module.exports.create = async (req, res) => {
    try {
        const roles = await roleService.getTitleRole();
        res.render("admin/pages/account/create", {
            roles
        });
    } catch (error) {
        next(error);
    }
}

// [POST] admin/accounts/create
module.exports.createPost = async (req, res) => {
    try {
        const emailExits = await Account.findOne({ email: req.body.email, deleted: false }).select("_id").lean();
        if (emailExits) {
            req.flash("thatbai", "Email đã tồn tại !!")
            res.redirect(`${conFig.prefixAdmin}/accounts`);
        } else {
            req.body.password = await bcrypt.hash(req.body.password, saltRounds);
            const record = new Account(req.body);
            await record.save();
            await invalidateAccountSearchCache();
            req.flash("thanhcong", "Đã tạo thành công 1 tài khoản mới")
            res.redirect(`${conFig.prefixAdmin}/accounts`);
        }
    } catch (error) {
        req.flash("thatbai", "Đã xảy ra lỗi !!!");
        res.redirect(`${conFig.prefixAdmin}/accounts`);
    }
}

// [GET] admin/accounts/edit/:id
module.exports.edit = async (req, res) => {
    try {
        const { id } = req.params;

        const { record, roles: allRoles } = await accountService.getAccountEditData(id);

        res.render("admin/pages/account/edit", {
            record,
            roleList: allRoles
        });

    } catch (error) {
        if (error.message === "ACCOUNT_NOT_FOUND") {
            req.flash("thatbai", "Không tìm thấy tài khoản");
        } else {
            req.flash("thatbai", "Đã xảy ra lỗi");
        }

        res.redirect(`${conFig.prefixAdmin}/accounts`);
    }
};

// [PATCH] admin/accounts/edit/:id
module.exports.editPatch = async (req, res) => {
    try {
        const id = req.params.id;
        const emailExits = await Account.findOne({
            _id: { $ne: id },
            email: req.body.email,
            deleted: false
        }).select("_id").lean();

        if (emailExits) {
            req.flash("thatbai", "Đã tồn tại email này, sửa tài khoản thất bại");
            return res.redirect("back");
        }

        if (req.body.password) {
            req.body.password = await bcrypt.hash(req.body.password, saltRounds);
        } else {
            delete req.body.password;
        }

        if (!req.body.avatar) {
            delete req.body.avatar;
        }

        await Account.updateOne({ _id: id }, req.body);
        await invalidateAccountSearchCache();
        req.flash('thanhcong', "Bạn đã chỉnh sửa tài khoản thành công");
        res.redirect(`${conFig.prefixAdmin}/accounts`);

    } catch (error) {
        console.error(error);
        req.flash("thatbai", "Đã xảy ra lỗi");
        res.redirect("back");
    }
}

// [GET] admin/accounts/detail/:id
module.exports.detail = async (req, res) => {
    try {
        const id = req.params.id;

        const record = await accountService.getAccountDetail(id);

        return res.render("admin/pages/account/detail", {
            record
        });

    } catch (error) {
        console.error(error);

        if (error.message === "NOT_FOUND") {
            req.flash("thatbai", "Tài khoản không tồn tại");
        } else if (error.message === "INVALID_ID") {
            req.flash("thatbai", "ID không hợp lệ");
        } else {
            req.flash("thatbai", "Lấy dữ liệu thất bại");
        }

        return res.redirect(`${conFig.prefixAdmin}/accounts`);
    }
};

// [GET] admin/accounts/user
module.exports.accountUser = async (req, res) => {
    try {
        const { listUser, pagination, keyword, status } =
            await accountService.getAccountUsers(req.query);

        const filterStatus = filterStatusHelper(status);

        res.render("admin/pages/account/accountUser", {
            listUser,
            pagination,
            filterStatus,
            keyword
        });

    } catch (error) {
        console.error(error);
        req.flash("thatbai", "Đã xảy ra lỗi");
        res.redirect("back");
    }
};

// [PATCH] admin/accounts/user/change-status/:status/:id
module.exports.changeStatusUser = async (req, res) => {
    try {
        const { id, status } = req.params;

        await accountService.changeStatusUser(id, status);

        await invalidateAccountSearchCache();

        req.flash("thanhcong", "Cập nhật trạng thái người dùng thành công");

    } catch (error) {
        if (error.message === "USER_NOT_FOUND") {
            req.flash("thatbai", "Không tìm thấy người dùng");
        } else {
            req.flash("thatbai", "Cập nhật trạng thái thất bại");
        }
    }

    res.redirect(`${conFig.prefixAdmin}/accounts/user`);
};

// [DELETE] admin/accounts/user/delete/:id
module.exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        await accountService.deleteUser(id);

        await invalidateAccountSearchCache();

        req.flash("thanhcong", "Xóa người dùng thành công");

    } catch (error) {
        if (error.message === "USER_NOT_FOUND_OR_DELETED") {
            req.flash("thatbai", "Người dùng không tồn tại hoặc đã bị xóa");
        } else {
            req.flash("thatbai", "Xóa người dùng thất bại");
        }
    }

    res.redirect(`${conFig.prefixAdmin}/accounts/user`);
};

// [PATCH] admin/accounts/user/restore/:id
module.exports.restoreUser = async (req, res) => {
    try {
        const { id } = req.params;

        await accountService.restoreUser(id);

        await invalidateAccountSearchCache();

        req.flash("thanhcong", "Khôi phục người dùng thành công");

    } catch (error) {
        if (error.message === "USER_NOT_FOUND_OR_NOT_DELETED") {
            req.flash("thatbai", "Người dùng không tồn tại hoặc chưa bị xóa");
        } else {
            req.flash("thatbai", "Khôi phục người dùng thất bại");
        }
    }

    res.redirect(`${conFig.prefixAdmin}/accounts/user`);
};
