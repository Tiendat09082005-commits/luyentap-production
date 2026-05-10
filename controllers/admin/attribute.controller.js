const Attribute = require("../../models/attribute.model");
const attributeService = require("../../services/admin/attribute.service");

// [GET] admin/attribute/
module.exports.index = async (req, res) => {
    try {
        const attributes = await attributeService.getAttributes(req.query);

        res.render("admin/pages/attribute/index", {
            attributes
        });

    } catch (error) {
        console.error(error);

        req.flash("thatbai", "Đã xảy ra lỗi");
        res.redirect("back");
    }
};

// [POST] admin/attribute/create
module.exports.create = async (req, res) => {
    try {
        const record = await attributeService.createAttribute(req.body);

        return res.status(201).json({
            success: true,
            message: "Thêm thuộc tính thành công",
            data: record
        });

    } catch (error) {
        console.error("CREATE ATTRIBUTE ERROR:", error);

        if (error.message.startsWith("DUPLICATE_")) {
            const field = error.message.replace("DUPLICATE_", "").toLowerCase();

            return res.status(400).json({
                success: false,
                message: `${field} đã tồn tại`
            });
        }

        return res.status(500).json({
            success: false,
            message: "Lỗi server khi thêm thuộc tính"
        });
    }
};


// [DELETE] admin/attribute/delete/:slug
module.exports.delete = async (req, res) => {
    try {
        const { slug } = req.params;

        await attributeService.deleteAttribute(slug);

        return res.status(200).json({
            success: true,
            message: "Xóa thuộc tính thành công"
        });

    } catch (error) {
        console.error("DELETE ATTRIBUTE ERROR:", error);

        if (error.message === "ATTRIBUTE_NOT_FOUND_OR_DELETED") {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thuộc tính hoặc đã bị xóa"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Lỗi server"
        });
    }
};

//[PATCH] admin/attribute/edit/:slug
module.exports.edit = async (req, res) => {
    try {
        const { slug } = req.params;

        await attributeService.updateAttribute(slug, req.body);

        return res.json({
            success: true,
            message: "Cập nhật thành công"
        });

    } catch (error) {
        console.error("UPDATE ATTRIBUTE ERROR:", error);

        if (error.message === "ATTRIBUTE_NOT_FOUND") {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy thuộc tính"
            });
        }

        if (error.message.startsWith("DUPLICATE_")) {
            const field = error.message.replace("DUPLICATE_", "").toLowerCase();

            return res.status(400).json({
                success: false,
                message: `${field} đã tồn tại`
            });
        }

        return res.status(500).json({
            success: false,
            message: "Lỗi server"
        });
    }
};
