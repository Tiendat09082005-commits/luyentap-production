const Attribute = require("../../models/attribute.model");

class AttributeRepository {
    async find(find) {
        return Attribute.find(find)
            .select("title slug code status values createdAt")
            .sort({ createdAt: -1 })
            .lean();
    }

    async create(data) {
        return Attribute.create(data);
    }

    async findOne(find) {
        return Attribute.findOne(find)
            .select("title slug code status values createdAt")
            .lean();
    }

    async update(query, data) {
        return Attribute.findOneAndUpdate(
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
        return Attribute.updateOne(
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
}

module.exports = new AttributeRepository();
