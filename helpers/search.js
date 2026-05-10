module.exports = (query) => {
    const objectSearch = {
        keyword: "",
        regex: ""
    };

    if (query.keyword) {
        objectSearch.keyword = query.keyword.trim();
        const escapedKeyword = objectSearch.keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        objectSearch.regex = new RegExp(escapedKeyword, "i");
    }

    return objectSearch;
};
