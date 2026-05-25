const conFig = require("../../config/system");
const cacheService = require("../../services/cache.service");
const accountService = require("../../services/admin/account.service");
const roleService = require("../../services/admin/role.service");
const filterStatusHelper = require("../../helpers/filterStatus");
const flash = require("../../helpers/flash.helper");
const ERROR_CODE = require("../../constants/error-code");

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
module.exports.create = async (req, res, next) => {
    try {
        const roles = await roleService.getTitleRole();
        res.render("admin/pages/account/create", {
            roles
        });
    } catch (error) {
        console.error("Lỗi khi tải trang tạo tài khoản:", error);
        next(error);
    }
};

// [POST] admin/accounts/create
module.exports.createPost = async (req, res) => {
    try {
        await accountService.createAccount(req.body);
        await invalidateAccountSearchCache();
        flash.flashSuccess(req, "Đã tạo thành công 1 tài khoản mới");
        res.redirect(`${conFig.prefixAdmin}/accounts`);
    } catch (error) {
        console.error("Lỗi khi tạo tài khoản:", error);
        if (error.code === ERROR_CODE.ACCOUNT_DUPLICATE_EMAIL) {
            flash.flashError(req, "Email đã tồn tại !!");
        } else {
            flash.flashError(req, "Đã xảy ra lỗi !!!");
        }
        res.redirect("back");
    }
};

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
        if (error.code === ERROR_CODE.ACCOUNT_NOT_FOUND) {
            flash.flashError(req, "Không tìm thấy tài khoản");
        } else {
            flash.flashError(req, "Đã xảy ra lỗi");
        }

        res.redirect(`${conFig.prefixAdmin}/accounts`);
    }
};

// [PATCH] admin/accounts/edit/:id
module.exports.editPatch = async (req, res) => {
    try {
        const id = req.params.id;
        await accountService.updateAccount(id, req.body);
        await invalidateAccountSearchCache();
        flash.flashSuccess(req, "Bạn đã chỉnh sửa tài khoản thành công");
        res.redirect(`${conFig.prefixAdmin}/accounts`);

    } catch (error) {
        console.error(error);
        if (error.code === ERROR_CODE.ACCOUNT_DUPLICATE_EMAIL) {
            flash.flashError(req, "Đã tồn tại email này, sửa tài khoản thất bại");
        } else if (error.code === ERROR_CODE.ACCOUNT_NOT_FOUND) {
            flash.flashError(req, "Không tìm thấy tài khoản");
        } else {
            flash.flashError(req, "Đã xảy ra lỗi");
        }
        res.redirect("back");
    }
};

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

        if (error.code === ERROR_CODE.ACCOUNT_NOT_FOUND) {
            flash.flashError(req, "Tài khoản không tồn tại");
        } else if (error.code === ERROR_CODE.ACCOUNT_INVALID_ID) {
            flash.flashError(req, "ID không hợp lệ");
        } else {
            flash.flashError(req, "Lấy dữ liệu thất bại");
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
        flash.flashError(req, "Đã xảy ra lỗi");
        res.redirect("back");
    }
};

// [PATCH] admin/accounts/user/change-status/:status/:id
module.exports.changeStatusUser = async (req, res) => {
    try {
        const { id, status } = req.params;

        await accountService.changeStatusUser(id, status);

        await invalidateAccountSearchCache();

        flash.flashSuccess(req, "Cập nhật trạng thái người dùng thành công");

    } catch (error) {
        if (error.code === ERROR_CODE.USER_NOT_FOUND) {
            flash.flashError(req, "Không tìm thấy người dùng");
        } else {
            flash.flashError(req, "Cập nhật trạng thái thất bại");
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

        flash.flashSuccess(req, "Xóa người dùng thành công");

    } catch (error) {
        if (error.code === ERROR_CODE.USER_NOT_FOUND_OR_DELETED) {
            flash.flashError(req, "Người dùng không tồn tại hoặc đã bị xóa");
        } else {
            flash.flashError(req, "Xóa người dùng thất bại");
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

        flash.flashSuccess(req, "Khôi phục người dùng thành công");

    } catch (error) {
        if (error.code === ERROR_CODE.USER_NOT_FOUND_OR_NOT_DELETED) {
            flash.flashError(req, "Người dùng không tồn tại hoặc chưa bị xóa");
        } else {
            flash.flashError(req, "Khôi phục người dùng thất bại");
        }
    }

    res.redirect(`${conFig.prefixAdmin}/accounts/user`);
};
