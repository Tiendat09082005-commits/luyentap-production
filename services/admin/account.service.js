const mongoose = require("mongoose");
const paginationHelper = require("../../helpers/pagination");
const Account = require("../../models/accounts.model");
const Role = require("../../models/roles.model");
const bcrypt = require("bcrypt");
const SALT_ROUNDS = process.env.SALT_ROUNDS || 10;
const User = require("../../models/user.model");
const searchHelper = require("../../helpers/search");

const getAccounts = async (query) => {
    const find = { deleted: false };

    const total = await Account.countDocuments(find);
    const pagination = paginationHelper(query, total);

    const records = await Account.find(find)
        .select("-password -token")
        .limit(pagination.limit)
        .skip(pagination.skip)
        .populate({
            path: "role_id",
            select: "title",
            match: { deleted: false }
        })
        .lean();

    return {
        records,
        pagination
    };
};

const createAccount = async (data) => {
    try {
        const { email, password, fullName, avatar } = data;

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        const record = await Account.create({
            email,
            password: hashedPassword,
            fullName,
            avatar
        });

        return record;

    } catch (error) {
        if (error.code === 11000) {
            throw new Error("EMAIL_EXISTS");
        }

        throw error;
    }
};

const getAccountEditData = async (id) => {
    const [record, roles] = await Promise.all([
        Account.findOne({
            _id: id,
            deleted: false
        })
        .select("-password -token")
        .lean(),

        Role.find({ deleted: false }).select("title").lean()
    ]);

    if (!record) {
        throw new Error("ACCOUNT_NOT_FOUND");
    }

    return {
        record,
        roles
    };
};



const updateAccount = async (id, data) => {
    try {
        const updateData = {};

        // whitelist field
        if (data.email) updateData.email = data.email;
        if (data.fullName) updateData.fullName = data.fullName;
        if (data.role_id) updateData.role_id = data.role_id;

        // password
        if (data.password) {
            updateData.password = await bcrypt.hash(data.password, SALT_ROUNDS);
        }

        // avatar
        if (data.avatar) {
            updateData.avatar = data.avatar;
        }

        const result = await Account.updateOne(
            { _id: id, deleted: false },
            updateData
        );

        if (result.matchedCount === 0) {
            throw new Error("ACCOUNT_NOT_FOUND");
        }

        return true;

    } catch (error) {
        if (error.code === 11000) {
            throw new Error("EMAIL_EXISTS");
        }

        throw error;
    }
};

const getAccountDetail = async (id) => {
    // validate ObjectId ngay tại service (double safety)
    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error("INVALID_ID");
    }

    const record = await Account.findOne({
        _id: id,
        deleted: false
    })
    .select("-token -password")
    .populate("role_id", "title")
    .lean();

    if (!record) {
        throw new Error("NOT_FOUND");
    }

    return record;
};



const getAccountUsers = async (query) => {
    const find = {};

    //  filter status + deleted
    if (query.status === "deleted") {
        find.deleted = true;
    } else {
        find.deleted = false;
        if (query.status === "active") {
            // Khớp với logic bên Pug: không bị khóa và không xóa thì coi là hoạt động
            find.status = { $ne: "inactive" };
        } else if (query.status === "inactive") {
            find.status = "inactive";
        }
    }

    //  search
    const search = searchHelper(query);
    if (search.regex) {
        find.$or = [
            { fullName: search.regex },
            { email: search.regex }
        ];
    }

    //  đếm tổng 
    const total = await User.countDocuments(find);

    //  build pagination
    const pagination = paginationHelper(query, total);

    //  query list
    const listUser = await User.find(find)
        .select("fullName email status avatar phone tokenUser createdAt deleted") // chỉ lấy field cần
        .sort({ createdAt: -1 }) // dùng index createdAt
        .limit(pagination.limit)
        .skip(pagination.skip)
        .lean();

    return {
        listUser,
        pagination,
        keyword: search.keyword,
        status: query.status || ""
    };
};


const changeStatusUser = async (id, status) => {
    const result = await User.updateOne(
        { _id: id, deleted: false },
        { status }
    );

    if (result.matchedCount === 0) {
        throw new Error("USER_NOT_FOUND");
    }

    return true;
};


const deleteUser = async (id) => {
    const result = await User.updateOne(
        { _id: id, deleted: false },
        {
            deleted: true,
            deletedAt: new Date()
        }
    );

    if (result.matchedCount === 0) {
        throw new Error("USER_NOT_FOUND_OR_DELETED");
    }

    return true;
};

const restoreUser = async (id) => {
    const result = await User.updateOne(
        { _id: id, deleted: true }, 
        {
            deleted: false,
            $unset: { deletedAt: "" }
        }
    );

    if (result.matchedCount === 0) {
        throw new Error("USER_NOT_FOUND_OR_NOT_DELETED");
    }

    return true;
}

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