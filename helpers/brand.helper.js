// escape các kí tự đặc biệt trong regex 
const escapeRegex = (text) => {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}; 

const normalizeBrandData = (data) => {
    const brandData = {};

    if (data.title !== undefined) {
        brandData.title = data.title.trim();
    }

    if (data.description !== undefined) {
        brandData.description = data.description.trim();
    }

    if (data.logo !== undefined) {
        brandData.logo = data.logo.trim();
    }

    if (data.status !== undefined) {
        brandData.status = data.status;
    }

    return brandData;
};
module.exports = {
    escapeRegex,
    normalizeBrandData
};