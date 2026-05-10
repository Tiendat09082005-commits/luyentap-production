const Attribute = require("../../models/attribute.model.js");

const getAttributes = async (query) => {
    const find = {
        deleted: false
    };

    // filter status
    if (query.status) {
        find.status = query.status;
    }

    // search nhẹ (nếu có)
    if (query.keyword) {
        find.title = {
            $regex: query.keyword.trim(),
            $options: "i"
        };
    }

    const attributes = await Attribute.find(find)
        .select("title slug code status values") 
        .sort({ createdAt: -1 }) // tận dụng index
        .lean();

    return attributes;
};


const createAttribute = async (data) => {
    try {
        const attributeData = {};

        // whitelist field
        attributeData.title = data.title.trim();
        attributeData.code = data.code.trim().toUpperCase();

        if (data.status) {
            attributeData.status = data.status;
        }

        // xử lý values
        if (data.values) {
            attributeData.values = [
                ...new Set(
                    data.values
                        .split(",")
                        .map(v => v.trim())
                        .filter(Boolean)
                )
            ];
        }

        const record = await Attribute.create(attributeData);

        return record;

    } catch (error) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            throw new Error(`DUPLICATE_${field.toUpperCase()}`);
        }

        throw error;
    }
};

const deleteAttribute = async (slug) => {
    const result = await Attribute.updateOne(
        { slug, deleted: false }, 
        {
            deleted: true,
            deletedAt: new Date()
        }
    );

    if (result.matchedCount === 0) {
        throw new Error("ATTRIBUTE_NOT_FOUND_OR_DELETED");
    }

    return true;
};

const updateAttribute = async (slug, data) => {
    try {
        const updateData = {};

        // whitelist + normalize
        if (data.title) {
            updateData.title = data.title.trim();
        }

        if (data.code) {
            updateData.code = data.code.trim().toUpperCase();
        }

        if (data.status) {
            updateData.status = data.status;
        }

        if (data.values) {
            updateData.values = [
                ...new Set(
                    data.values
                        .split(",")
                        .map(v => v.trim())
                        .filter(Boolean)
                )
            ];
        }

        const updated = await Attribute.findOneAndUpdate(
            { slug, deleted: false },
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updated) {
            throw new Error("ATTRIBUTE_NOT_FOUND");
        }

        return updated;

    } catch (error) {
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            throw new Error(`DUPLICATE_${field.toUpperCase()}`);
        }

        throw error;
    }
};


module.exports = {
    getAttributes,
    createAttribute,
    deleteAttribute,
    updateAttribute
};