// escape các kí tự đặc biệt trong regex 
const escapeRegex = (text) => {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

const normalizeAttributeData = (data) => {
    const attributeData = {};

    if (data.title !== undefined) {
        attributeData.title = data.title.trim();
    }

    if (data.code !== undefined) {
        attributeData.code = data.code.trim().toUpperCase();
    }

    if (data.status !== undefined) {
        attributeData.status = data.status;
    }

    if (data.values !== undefined) {
        if (typeof data.values === "string") {
            attributeData.values = [
                ...new Set(
                    data.values
                        .split(",")
                        .map(v => v.trim())
                        .filter(Boolean)
                )
            ];
        } else if (Array.isArray(data.values)) {
            attributeData.values = [
                ...new Set(
                    data.values
                        .map(v => String(v).trim())
                        .filter(Boolean)
                )
            ];
        }
    }

    return attributeData;
};

module.exports = {
    escapeRegex,
    normalizeAttributeData
};
