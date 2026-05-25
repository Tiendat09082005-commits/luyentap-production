const Brand = require("../../models/brand.model");
const { escapeRegex } = require("../../helpers/brand.helper");



const getBrands = async (query) => {
    const find = {
        deleted: false
    };

    const status = query.status || "";
    const keyword = (query.keyword || "").trim();

    // filter status
    if (status === "active" || status === "inactive") {
        find.status = status;
    }

    // search an toàn
    if (keyword) {
        const safeKeyword = escapeRegex(keyword);

        find.$or = [
            { title: { $regex: safeKeyword, $options: "i" } },
            { slug: { $regex: safeKeyword, $options: "i" } },
            { description: { $regex: safeKeyword, $options: "i" } }
        ];
    }

    const brands = await Brand.find(find)
        .select("title slug logo status createdAt") 
        .sort({ createdAt: -1 })
        .lean();

    return {
        brands,
        keyword,
        status
    };
};



const createBrand = async (data) => {
    try {
        const brandData = {};

        // whitelist + normalize
        brandData.title = data.title.trim();

        if (data.description) {
            brandData.description = data.description.trim();
        }

        if (data.logo) {
            brandData.logo = data.logo.trim();
        }

        brandData.status = data.status || "active";

        const record = await Brand.create(brandData);

        return record;

    } catch (error) {
        if (error.code === 11000) {
            throw new Error("DUPLICATE_SLUG");
        }

        throw error;
    }
};


const getBrandDetail = async (id) => {
    const brand = await Brand.findOne({
        _id: id,
        deleted: false
    })
    .select("title slug logo description status createdAt") // ⚡ tránh lấy thừa
    .lean();

    if (!brand) {
        throw new Error("BRAND_NOT_FOUND");
    }

    return brand;
};

const changeStatusBrand = async (id, status) => {
    const result = await Brand.updateOne(
        { _id: id, deleted: false },
        { status }
    );

    if (result.matchedCount === 0) {
        throw new Error("BRAND_NOT_FOUND");
    }

    return true;
}

const updateBrand = async (id, data) => {
    try {
        const updateData = {};

        // whitelist + normalize
        if (data.title !== undefined) {
            updateData.title = data.title.trim();
        }

        if (data.description !== undefined) {
            updateData.description = data.description.trim();
        }

        if (data.status) {
            updateData.status = data.status;
        }

        if (data.logo) {
            updateData.logo = data.logo.trim();
        }

        const brand = await Brand.findOneAndUpdate(
            { _id: id, deleted: false },
            updateData,
            {
                new: true,
                runValidators: true
            }
        );

        if (!brand) {
            throw new Error("BRAND_NOT_FOUND");
        }

        return brand;

    } catch (error) {
        if (error.code === 11000) {
            throw new Error("DUPLICATE_SLUG");
        }

        throw error;
    }
};


const deleteBrand = async (id) => {
    const result = await Brand.updateOne(
        { _id: id, deleted: false },
        {
            deleted: true,
            deletedAt: new Date()
        }
    );

    if (result.matchedCount === 0) {
        throw new Error("BRAND_NOT_FOUND_OR_DELETED");
    }

    return true;
};

module.exports = {
    getBrands,
    createBrand,
    getBrandDetail,
    changeStatusBrand,
    updateBrand,
    deleteBrand
};