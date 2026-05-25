const Account = require("../../models/accounts.model");

class AccountRepository {
    async find(find, select = "-password -token") {
        return Account.find(find)
            .select(select)
            .lean();
    }

    async findPaginated(find, pagination, select = "-password -token") {
        return Account.find(find)
            .select(select)
            .limit(pagination.limit)
            .skip(pagination.skip)
            .populate({
                path: "role_id",
                select: "title",
                match: { deleted: false }
            })
            .lean();
    }

    async countDocuments(find) {
        return Account.countDocuments(find);
    }

    async findOne(find, select = "-password -token") {
        return Account.findOne(find)
            .select(select)
            .lean();
    }

    async create(data) {
        return Account.create(data);
    }

    async updateOne(query, data) {
        return Account.updateOne(query, data);
    }
}

module.exports = new AccountRepository();
