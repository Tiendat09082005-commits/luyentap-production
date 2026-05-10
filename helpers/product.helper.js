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

module.exports = {
    collectProductGallery,
    assignProductPriceFromVariants
};
