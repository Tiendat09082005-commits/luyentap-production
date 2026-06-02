const Brand = require("../../models/brand.model");

class BrandRepository {
    async find(find) {
        return Brand.find(find)
            .select("title slug logo status createdAt")
            .sort({ createdAt: -1 })
            .lean();
    }
    async create(data) {
        return Brand.create(data);
    }

    async findOne(find) {
        return Brand.findOne(find)
            .select("title slug logo description status createdAt")
            .lean();   
    }
    async updateStatus(id, status) {
        return Brand.updateOne(
            {
                _id: id,
                deleted: false
            },
            {
                status
            }
        );
    }
    
    async update(id, data) {
        return Brand.findOneAndUpdate(
            {
                _id: id,
                deleted: false
            },
            data,
            {
                new: true,
                runValidators: true
            }
        );
    }

    async softDelete(id) {
        return Brand.updateOne(
            {
                _id: id,
                deleted: false
            },
            {
                deleted: true,
                deletedAt: new Date()
            }
        );
    }
}

module.exports = new BrandRepository();