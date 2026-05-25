const systemConfig = require("../../config/system");
const attributeService = require("../../services/admin/attribute.service");
const flash = require("../../helpers/flash.helper");
const ERROR_CODE = require("../../constants/error-code");

// [GET] admin/attribute/
module.exports.index = async (req, res) => {
    try {
        const attributes = await attributeService.getAttributes(req.query);

        res.render("admin/pages/attribute/index", {
            attributes
        });

    } catch (error) {
        console.error("GET ATTRIBUTE ERROR:", error);

        flash.flashError(req, "Đã xảy ra lỗi");
        return res.redirect(`${systemConfig.prefixAdmin}/dashboard`);
    }
};

// [POST] admin/attribute/create
module.exports.create = async (req, res) => {
    try {
        const record = await attributeService.createAttribute(req.body);

        flash.flashSuccess(req, "Thêm thuộc tính thành công");
        return res.status(201).json({
            success: true,
            message: "Thêm thuộc tính thành công",
            data: record
        });

    } catch (error) {
        console.error("CREATE ATTRIBUTE ERROR:", error);

        let message = "Lỗi server khi thêm thuộc tính";
        if (error.code === ERROR_CODE.ATTRIBUTE_DUPLICATE_SLUG) {
            message = "Thuộc tính đã tồn tại (slug bị trùng)";
        } else if (error.code === ERROR_CODE.ATTRIBUTE_DUPLICATE_CODE) {
            message = "Mã thuộc tính đã bị trùng";
        }

        flash.flashError(req, message);

        return res.status(error.statusCode || 500).json({
            success: false,
            message
        });
    }
};

// [DELETE] admin/attribute/delete/:slug
module.exports.delete = async (req, res) => {
    try {
        const { slug } = req.params;

        await attributeService.deleteAttribute(slug);

        flash.flashSuccess(req, "Xóa thuộc tính thành công");
        return res.status(200).json({
            success: true,
            message: "Xóa thuộc tính thành công"
        });

    } catch (error) {
        console.error("DELETE ATTRIBUTE ERROR:", error);

        let message = "Lỗi server";
        if (error.code === ERROR_CODE.ATTRIBUTE_NOT_FOUND_OR_DELETED) {
            message = "Không tìm thấy hoặc đã bị xóa";
        }

        flash.flashError(req, message);

        return res.status(error.statusCode || 500).json({
            success: false,
            message
        });
    }
};

//[PATCH] admin/attribute/edit/:slug
module.exports.edit = async (req, res) => {
    try {
        const { slug } = req.params;

        await attributeService.updateAttribute(slug, req.body);

        flash.flashSuccess(req, "Cập nhật thành công");
        return res.json({
            success: true,
            message: "Cập nhật thành công"
        });

    } catch (error) {
        console.error("UPDATE ATTRIBUTE ERROR:", error);

        let message = "Lỗi server";
        if (error.code === ERROR_CODE.ATTRIBUTE_NOT_FOUND) {
            message = "Không tìm thấy thuộc tính";
        } else if (error.code === ERROR_CODE.ATTRIBUTE_DUPLICATE_SLUG) {
            message = "Tên thuộc tính bị trùng";
        } else if (error.code === ERROR_CODE.ATTRIBUTE_DUPLICATE_CODE) {
            message = "Mã thuộc tính bị trùng";
        }

        flash.flashError(req, message);

        return res.status(error.statusCode || 500).json({
            success: false,
            message
        });
    }
};
