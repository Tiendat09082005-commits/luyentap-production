const productService = require("../../services/client/product.service");
const authMiddleware = require("../../middleware/client/auth.middleware");

// [GET] /products 
module.exports.index = async (req, res) => {
    try {
        const query = {
            keyword: req.query.keyword,
            category: req.query.category,
            minPrice: req.query.minPrice,
            maxPrice: req.query.maxPrice,
            sortKey: req.query.sortKey,
            sortValue: req.query.sortValue,
            page: req.query.page || 1,
            limit: req.query.limit || 20 // Default limit added for pagination
        };

        const result = await productService.getProducts(query, res.locals.user);

        res.render("client/pages/products/index.pug", {
            products: result.products,
            keyword: query.keyword,
            sortKey: query.sortKey,
            sortValue: query.sortValue
        });
    } catch (error) {
        console.error("[ProductController] Error in index:", error);
        res.status(500).send("Lỗi hệ thống");
    }
};

// [GET] /products/detail/:id
module.exports.detail = async (req, res) => {
    try {
        const id = req.params.id;
        const data = await productService.getProductDetail(id, req.user);

        if (!data) {
            return res.status(404).render("client/pages/products/detail", {
                product: null,
                galleryImages: [],
                commentsData: {
                    comments: [],
                    pagination: {
                        page: 1, limit: 10, totalRootComments: 0,
                        totalPages: 1, hasNextPage: false, hasPrevPage: false
                    }
                }
            });
        }

        res.render("client/pages/products/detail", data);
    } catch (error) {
        console.error("[ProductController] Error in detail:", error);
        res.redirect("/products");
    }
};

// [POST] /products/favorite/:productId
module.exports.productFavorite = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Vui lòng đăng nhập"
            });
        }

        const productId = req.params.productId;
        const userId = req.user._id || req.user.id;

        const result = await productService.toggleFavorite(productId, userId);

        if (req.cookies.tokenUser) {
            await authMiddleware.deleteCachedUserByToken(req.cookies.tokenUser);
        }

        return res.status(200).json({
            success: true,
            type: result.type
        });
    } catch (error) {
        console.error("[ProductController] Error in productFavorite:", error);
        
        if (error.message === "ID sản phẩm không hợp lệ" || error.message === "Không tìm thấy người dùng") {
            return res.status(400).json({ success: false, message: error.message });
        }

        res.status(500).json({
            success: false,
            message: "Lỗi hệ thống khi cập nhật yêu thích"
        });
    }
};
