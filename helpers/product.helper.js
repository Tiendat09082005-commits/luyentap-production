const { priceNew } = require("./priceNew");

/**
 * Collects all unique images for a product gallery including variants and attributes
 * @param {Object} product 
 * @param {Array} variants 
 * @returns {Array<string>} Unique gallery image URLs
 */
function collectProductGallery(product, variants = []) {
    const imageSet = new Set();
    const galleryImages = [];

    const pushImage = (image) => {
        if (!image || typeof image !== "string") return;
        const normalized = image.trim();
        if (!normalized || imageSet.has(normalized)) return;
        imageSet.add(normalized);
        galleryImages.push(normalized);
    };

    // Main product images
    pushImage(product?.thumbnail);
    if (Array.isArray(product?.images)) {
        product.images.forEach(pushImage);
    }

    // Variant images
    if (Array.isArray(variants)) {
        variants.forEach((variant) => {
            pushImage(variant?.thumbnail);
        });
    }

    // Attribute specific images
    const visualAttrs = Array.isArray(product?.attributes)
        ? product.attributes.filter((attr) => attr && attr.affectsImage && attr.code)
        : [];

    const variantImages = product?.variantImages && typeof product.variantImages === "object"
        ? product.variantImages
        : {};

    visualAttrs.forEach((attr) => {
        const attrImages = variantImages[attr.code];
        if (!attrImages || typeof attrImages !== "object") return;

        Object.values(attrImages).forEach((imageConfig) => {
            if (!imageConfig || typeof imageConfig !== "object") return;
            pushImage(imageConfig.thumb);

            if (Array.isArray(imageConfig.gallery)) {
                imageConfig.gallery.forEach(pushImage);
            }
        });
    });

    return galleryImages;
}

/**
 * Calculates the best (minimum) price for a product based on its variants
 * @param {Object} product 
 * @param {Array} variants 
 */
function assignProductPriceFromVariants(product, variants) {
    if (variants && variants.length > 0) {
        let minPriceNew = Infinity;
        let minVariant = null;

        variants.forEach(v => {
            const currentPriceNew = priceNew(v.price, v.discount);
            if (currentPriceNew < minPriceNew) {
                minPriceNew = currentPriceNew;
                minVariant = v;
            }
        });

        product.priceNew = minPriceNew;
        product.price = minVariant.price;
        product.discount = minVariant.discount;

        if (!product.thumbnail || product.thumbnail === "") {
            const variantWithImg = variants.find(v => v.thumbnail);
            if (variantWithImg) {
                product.thumbnail = variantWithImg.thumbnail;
            }
        }
    } else {
        product.priceNew = 0;
        product.price = 0;
        product.discount = 0;
    }
}

/**
 * Normalizes request body into product data and variant data
 * @param {Object} body 
 * @returns {Object} { productData, variantData }
 */
function normalizeProductPayload(body) {
    const productData = {
        title: body.title,
        category_id: body.category_id || null,
        brand_id: body.brand_id || null,
        description: body.description || "",
        shortDescription: body.shortDescription || "",
        thumbnail: body.thumbnail || "",
        images: Array.isArray(body.images) ? body.images : (body.images ? [body.images] : []),
        status: body.status || "active",
        attributes: [],
        variantImages: body.variantImages || {},
        specifications: []
    };

    // Parse attributes
    if (Array.isArray(body.attributes)) {
        productData.attributes = body.attributes.map(attr => ({
            attribute_id: attr.attribute_id,
            name: attr.name,
            code: attr.code,
            selectedValues: Array.isArray(attr.selectedValues) 
                ? attr.selectedValues 
                : (attr.selectedValues ? [attr.selectedValues] : []),
            useForVariant: attr.useForVariant === "true" || attr.useForVariant === true,
            affectsImage: attr.affectsImage === "true" || attr.affectsImage === true
        })).filter(attr => attr.attribute_id);
    }

    // Parse specifications
    if (Array.isArray(body.specifications)) {
        productData.specifications = body.specifications.map(spec => ({
            groupName: spec.groupName,
            items: Array.isArray(spec.items) ? spec.items.map(item => ({
                key: item.key,
                value: item.value
            })).filter(item => item.key && item.value) : []
        })).filter(spec => spec.groupName);
    }

    let variantData = [];
    if (body.productType === "simple") {
        variantData = [{
            attributes: {},
            price: parseFloat(body.price) || 0,
            discount: parseFloat(body.discount) || 0,
            stock: parseInt(body.stock) || 0,
            sku: body.sku || "",
            thumbnail: body.thumbnail || "",
            status: "active"
        }];
        productData.price = parseFloat(body.price) || 0;
        productData.discount = parseFloat(body.discount) || 0;
        productData.priceNew = priceNew(productData.price, productData.discount);
    } else {
        if (Array.isArray(body.variants)) {
            variantData = body.variants.map(v => {
                const attrMap = {};
                if (v.attributes && typeof v.attributes === "object") {
                    Object.keys(v.attributes).forEach(key => {
                        attrMap[key] = v.attributes[key];
                    });
                }
                return {
                    attributes: attrMap,
                    price: parseFloat(v.price) || 0,
                    discount: parseFloat(v.discount) || 0,
                    stock: parseInt(v.stock) || 0,
                    sku: v.sku || "",
                    thumbnail: v.thumbnail || "",
                    status: v.status || "active"
                };
            });
        }
        assignProductPriceFromVariants(productData, variantData);
    }

    return { productData, variantData };
}

module.exports = {
    collectProductGallery,
    assignProductPriceFromVariants,
    normalizeProductPayload
};
