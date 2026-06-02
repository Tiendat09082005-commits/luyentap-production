const User = require("../../models/user.model");

class UserRepository {
    async find(find, select = "fullName email status avatar phone tokenUser createdAt deleted") {
        return User.find(find)
            .select(select)
            .lean();
    }

    async findPaginated(find, pagination, select = "fullName email status avatar phone tokenUser createdAt deleted") {
        return User.find(find)
            .select(select)
            .sort({ createdAt: -1 })
            .limit(pagination.limit)
            .skip(pagination.skip)
            .lean();
    }

    async countDocuments(find) {
        return User.countDocuments(find);
    }

    async findOne(find, select) {
        let query = User.findOne(find);
        if (select) {
            query = query.select(select);
        }
        return query.lean();
    }

    async updateOne(query, data) {
        return User.updateOne(query, data);
    }
}

module.exports = new UserRepository();
