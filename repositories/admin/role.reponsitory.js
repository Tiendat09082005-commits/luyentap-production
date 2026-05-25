const Role = require("../../models/roles.model");

class RoleRepository {
    async find(find, select = "title description permissions createdAt") {
        return Role.find(find)
            .select(select)
            .sort({ createdAt: -1 })
            .lean();
    }

    async countDocuments(find) {
        return Role.countDocuments(find);
    }

    async findPaginated(find, pagination, select = "title description permissions createdAt") {
        return Role.find(find)
            .select(select)
            .sort({ createdAt: -1 })
            .limit(pagination.limit)
            .skip(pagination.skip)
            .lean();
    }

    async create(data) {
        return Role.create(data);
    }

    async findOne(find, select = "title description permissions createdAt updatedAt") {
        return Role.findOne(find)
            .select(select)
            .lean();
    }

    async update(query, data) {
        return Role.findOneAndUpdate(
            {
                ...query,
                deleted: false
            },
            data,
            {
                new: true,
                runValidators: true
            }
        );
    }

    async softDelete(query) {
        return Role.updateOne(
            {
                ...query,
                deleted: false
            },
            {
                deleted: true,
                deletedAt: new Date()
            }
        );
    }

    async bulkWrite(operations) {
        return Role.bulkWrite(operations);
    }
}

module.exports = new RoleRepository();
