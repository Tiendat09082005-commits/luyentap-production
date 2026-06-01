const mongoose = require("mongoose");
const paginationHelper = require("../../helpers/pagination");
const Accountrepository = require("../../repositories/admin/account.repository");
const Userrepository = require("../../repositories/admin/user.repository");
const Rolerepository = require("../../repositories/admin/role.repository");
const { normalizeAccountData } = require("../../helpers/account.helper");
const searchHelper = require("../../helpers/search");
const AppError = require("../../utils/AppError");
const ERROR_CODE = require("../../constants/error-code");

const getAccounts = async (query) => {
    const find = { deleted: false };

    const total = await Accountrepository.countDocuments(find);
    const pagination = paginationHelper(query, total);

    const records = await Accountrepository.findPaginated(find, pagination, "-password -token");

    return {
        records,
        pagination
    };
};

const createAccount = async (data) => {
    try {
        const accountData = await normalizeAccountData(data);
        const record = await Accountrepository.create(accountData);
        return record;
    } catch (error) {
        if (error.code === 11000) {
            throw new AppError(409, ERROR_CODE.ACCOUNT_DUPLICATE_EMAIL);
        }

        throw error;
    }
};

const getAccountEditData = async (id) => {
    const [record, roles] = await Promise.all([
        Accountrepository.findOne({
            _id: id,
            deleted: false
        }, "-password -token"),

        Rolerepository.find({ deleted: false }, "title")
    ]);

    if (!record) {
        throw new AppError(404, ERROR_CODE.ACCOUNT_NOT_FOUND);
    }

    return {
        record,
        roles
    };
};

const updateAccount = async (id, data) => {
    try {
        const updateData = await normalizeAccountData(data);

        const result = await Accountrepository.updateOne(
            { _id: id, deleted: false },
            updateData
        );

        if (result.matchedCount === 0) {
            throw new AppError(404, ERROR_CODE.ACCOUNT_NOT_FOUND);
        }

        return true;

    } catch (error) {
        if (error.code === 11000) {
            throw new AppError(409, ERROR_CODE.ACCOUNT_DUPLICATE_EMAIL);
        }

        throw error;
    }
};

const getAccountDetail = async (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError(400, ERROR_CODE.ACCOUNT_INVALID_ID);
    }

    const record = await Accountrepository.findOne({
        _id: id,
        deleted: false
    }, "-token -password");

    if (!record) {
        throw new AppError(404, ERROR_CODE.ACCOUNT_NOT_FOUND);
    }

    if (record.role_id) {
        const role = await Rolerepository.findOne({ _id: record.role_id, deleted: false }, "title");
        record.role_id = role || null;
    }

    return record;
};

const getAccountUsers = async (query) => {
    const find = {};

    if (query.status === "deleted") {
        find.deleted = true;
    } else {
        find.deleted = false;
        if (query.status === "active") {
            find.status = { $ne: "inactive" };
        } else if (query.status === "inactive") {
            find.status = "inactive";
        }
    }

    const search = searchHelper(query);
    if (search.regex) {
        find.$or = [
            { fullName: search.regex },
            { email: search.regex }
        ];
    }

    const total = await Userrepository.countDocuments(find);
    const pagination = paginationHelper(query, total);

    const listUser = await Userrepository.findPaginated(
        find,
        pagination,
        "fullName email status avatar phone tokenUser createdAt deleted"
    );

    return {
        listUser,
        pagination,
        keyword: search.keyword,
        status: query.status || ""
    };
};

const changeStatusUser = async (id, status) => {
    const result = await Userrepository.updateOne(
        { _id: id, deleted: false },
        { status }
    );

    if (result.matchedCount === 0) {
        throw new AppError(404, ERROR_CODE.USER_NOT_FOUND);
    }

    return true;
};

const deleteUser = async (id) => {
    const result = await Userrepository.updateOne(
        { _id: id, deleted: false },
        {
            deleted: true,
            deletedAt: new Date()
        }
    );

    if (result.matchedCount === 0) {
        throw new AppError(404, ERROR_CODE.USER_NOT_FOUND_OR_DELETED);
    }

    return true;
};

const restoreUser = async (id) => {
    const result = await Userrepository.updateOne(
        { _id: id, deleted: true }, 
        {
            deleted: false,
            $unset: { deletedAt: "" }
        }
    );

    if (result.matchedCount === 0) {
        throw new AppError(404, ERROR_CODE.USER_NOT_FOUND_OR_NOT_DELETED);
    }

    return true;
};

module.exports = {
    getAccounts,
    createAccount,
    getAccountEditData,
    updateAccount,
    getAccountDetail,
    getAccountUsers,
    changeStatusUser,
    deleteUser,
    restoreUser
};