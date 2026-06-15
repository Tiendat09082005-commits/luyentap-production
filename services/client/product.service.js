const Product = require("../../models/products.model");
const ProductVariant = require("../../models/productVariant.model");
const ProductCategory = require("../../models/products-category.model");
const Brand = require("../../models/brand.model");
const User = require("../../models/user.model");
const commentService = require("../../services/client/comment.service");
const searchHelper = require("../../helpers/search");
const { assignProductPriceFromVariants, collectProductGallery } = require("../../helpers/product.helper");
const { priceNew } = require("../../helpers/priceNew");
const mongoose = require("mongoose");

const BRAND_ALIASES = {
    apple: ["iphone", "ios"]
};

function normalizeTerm(value) {
    return String(value || "").trim().toLowerCase();
}

function collectCategoryDescendants(selectedCategory, childrenByParent) {
    const selectedIds = new Set([String(selectedCategory._id)]);
    const selectedTerms = new Set([
        normalizeTerm(selectedCategory.slug),
        normalizeTerm(selectedCategory.title)
    ]);
    const queue = [String(selectedCategory._id)];

    while (queue.length) {
        const currentId = queue.shift();
        const children = childrenByParent.get(currentId) || [];

        children.forEach((child) => {
            const childId = String(child._id);
            selectedTerms.add(normalizeTerm(child.slug));
            selectedTerms.add(normalizeTerm(child.title));

            if (selectedIds.has(childId)) return;
            selectedIds.add(childId);
            queue.push(childId);
        });
    }

    return { selectedIds, selectedTerms };
}

function matchBrandsFromTerms(brands, selectedTerms) {
    return brands
        .filter((brand) => {
            const brandSlug = normalizeTerm(brand.slug);
            const brandTitle = normalizeTerm(brand.title);
            const aliases = BRAND_ALIASES[brandSlug] || [];

            return (
                selectedTerms.has(brandSlug) ||
                selectedTerms.has(brandTitle) ||
                aliases.some((alias) => selectedTerms.has(alias))
            );
        })
        .map((brand) => brand._id);
}

class ProductService {

    async getProducts(query, user) {
        const { keyword, category, minPrice, maxPrice, page = 1, limit = 20 } = query;
        
        let find = { deleted: false, status: "active" };

        // 1. Search filter
        const objectSearch = searchHelper({ keyword });
        if (objectSearch.regex) {
            find.title = objectSearch.regex;
        }

        // 2. Category filter (Optimized)

        if (category && typeof category === "string") {
            const [allCategories, brands] = await Promise.all([
                ProductCategory.find({
                    deleted: false,
                    status: "active"
                }).select("_id title slug parent_id").lean(),
                Brand.find({
                    deleted: false,
                    status: "active"
                }).select("_id title slug").lean()
            ]);

            const childrenByParent = new Map();

            allCategories.forEach((cat) => {
                if (cat.parent_id) {
                    const parentId = String(cat.parent_id);
                    if (!childrenByParent.has(parentId)) {
                        childrenByParent.set(parentId, []);
                    }
                    childrenByParent.get(parentId).push(cat);
                }
            });

            const selectedCategory = allCategories.find((cat) => cat.slug === category.trim());

            if (selectedCategory) {
                const { selectedIds, selectedTerms } = collectCategoryDescendants(selectedCategory, childrenByParent);
                const matchedBrandIds = matchBrandsFromTerms(brands, selectedTerms);
                const categoryFilters = [{ category_id: { $in: Array.from(selectedIds) } }];

                if (matchedBrandIds.length) {
                    categoryFilters.push({ brand_id: { $in: matchedBrandIds } });
                }

                if (categoryFilters.length === 1) {
                    Object.assign(find, categoryFilters[0]);
                } else {
                    find.$or = categoryFilters;
                }
            } else {
                const selectedBrand = await Brand.findOne({ slug: category.trim(), deleted: false, status: "active" }).lean();
                if (selectedBrand) {
                    find.brand_id = selectedBrand._id;
                } else {
                    // Force empty result if neither category nor brand matches
                    find._id = null;
                }
            }
        }

        // 3. Fetch Products (Lean & Paginated)
        const rawProducts = await Product.find(find)
            .sort({ position: "desc" })
            .select("-description -content -__v") // Exclude heavy fields
            .lean();

        // 4. Batch Fetch Variants to eliminate N+1 queries
        const productIds = rawProducts.map(p => p._id);
        const allVariants = await ProductVariant.find({
            product_id: { $in: productIds },
            deleted: false,
            status: "active"
        }).select("product_id price discount thumbnail").lean();

        // Group variants by product ID (O(n) Map lookup)
        const variantMap = new Map();
        allVariants.forEach(variant => {
            const pid = String(variant.product_id);
            if (!variantMap.has(pid)) variantMap.set(pid, []);
            variantMap.get(pid).push(variant);
        });

        // 5. Process Products and Filter
        const parsedMinPrice = Number(minPrice) || 0;
        const parsedMaxPrice = Number(maxPrice) || 0;

        let processedProducts = rawProducts.map(product => {
            const variants = variantMap.get(String(product._id)) || [];
            assignProductPriceFromVariants(product, variants);

            // Default rating to 5 if not set or is 0
            product.rating = product.rating || 5;

            // Add Favorite Flag
            product.isFavorite = user?.products_favorite 
                ? user.products_favorite.some(id => String(id) === String(product._id))
                : false;
            
            return product;
        });

        // Apply Price Filter in JS
        if (parsedMinPrice || parsedMaxPrice) {
            processedProducts = processedProducts.filter(product => {
                const finalPrice = product.priceNew || 0;
                if (parsedMinPrice && finalPrice < parsedMinPrice) return false;
                if (parsedMaxPrice && finalPrice > parsedMaxPrice) return false;
                return true;
            });
        }

        // Apply Sorting in JS (since priceNew and discount are computed in JS from variants)
        const { sortKey, sortValue } = query;
        if (sortKey && sortValue) {
            processedProducts.sort((a, b) => {
                if (sortKey === "price") {
                    return sortValue === "desc" ? b.priceNew - a.priceNew : a.priceNew - b.priceNew;
                }
                if (sortKey === "discount") {
                    return sortValue === "desc" ? b.discount - a.discount : a.discount - b.discount;
                }
                return 0;
            });
        }

        // 6. Manual Pagination (because of JS filtering/sorting)
        const skipCount = (Number(page) - 1) * Number(limit);
        const paginatedProducts = processedProducts.slice(skipCount, skipCount + Number(limit));

        return {
            products: paginatedProducts,
            total: processedProducts.length,
            page: Number(page),
            limit: Number(limit)
        };
    }


    async getProductDetail(id, user) {
        const lookupField = mongoose.Types.ObjectId.isValid(id) ? "_id" : "slug";

        // 1. Fetch Product with Lean and Select to optimize
        const product = await Product.findOne({
            [lookupField]: id,
            deleted: false,
            status: "active"
        })
        .populate("brand_id", "title")
        .populate("category_id", "title")
        .lean();

        if (!product) return null;

        // Default rating to 5 if not set or is 0
        product.rating = product.rating || 5;

        // 2. Fetch Variants
        const variants = await ProductVariant.find({
            product_id: product._id,
            deleted: false,
            status: "active"
        }).lean();

        // 3. Format Data
        product.brand = product.brand_id?.title;
        product.category = product.category_id?.title;

        if (variants.length > 0) {
            const firstVariant = variants[0];
            product.price = firstVariant.price;
            product.discount = firstVariant.discount;
            product.priceNew = priceNew(product.price, product.discount);
            product.stock = variants.reduce((sum, v) => sum + (v.stock || 0), 0);
        } else {
            product.price = product.priceNew = product.discount = product.stock = 0;
        }

        // 4. Gather Extra Info
        const galleryImages = collectProductGallery(product, variants);
        
        const isFavorite = user?.products_favorite
            ? user.products_favorite.some(favId => String(favId) === String(product._id))
            : false;

        // Fetch comments (already optimized in commentService)
        const commentsData = await commentService.getCommentsTree(product._id, {
            page: 1,
            limit: 10
        });

        if (commentsData?.pagination) {
            commentsData.pagination.totalRootComments = Number(
                commentsData.pagination.totalRootComments ??
                commentsData.pagination.total ??
                0
            );
        }

        return {
            product,
            variants,
            galleryImages,
            isFavorite,
            commentsData
        };
    }


    async toggleFavorite(productId, userId) {
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            throw new Error("ID sản phẩm không hợp lệ");
        }

        const uId = String(userId);
        const pId = String(productId);

        // Fetch just the favorites array to minimize memory
        const user = await User.findById(uId).select("products_favorite").lean();
        if (!user) throw new Error("Không tìm thấy người dùng");

        const exists = user.products_favorite.some(id => String(id) === pId);

        // Atomic Operations to avoid race conditions
        if (exists) {
            await User.updateOne(
                { _id: uId },
                { $pull: { products_favorite: productId } }
            );
            return { type: "removed" };
        } else {
            await User.updateOne(
                { _id: uId },
                { $addToSet: { products_favorite: productId } }
            );
            return { type: "added" };
        }
    }
}

/**
 * DB OPTIMIZATION SUGGESTIONS:
 * 1. db.products.createIndex({ category_id: 1, status: 1, deleted: 1 })
 * 2. db.productvariants.createIndex({ product_id: 1, deleted: 1, status: 1 })
 * 3. To fix JS-based price filtering and manual pagination, denormalize 'minPriceNew' into the Product document.
 */

module.exports = new ProductService();
