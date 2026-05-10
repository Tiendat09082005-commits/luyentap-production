module.exports = (query, totalProduct) => {
    const pagination = {
        limit: 7,
        currentPage: 1,
        range: 2
    };

    // 1. Validate page
    let currentPage = parseInt(query.page);
    if (isNaN(currentPage) || currentPage < 1) {
        currentPage = 1;
    }

    // 2. Giới hạn page max
    const MAX_PAGE = 1000;
    if (currentPage > MAX_PAGE) {
        currentPage = MAX_PAGE;
    }

    pagination.currentPage = currentPage;

    // 3. Tính skip
    pagination.skip = (currentPage - 1) * pagination.limit;

    // 4. Tính totalPage
    const totalPage = Math.max(1, Math.ceil(totalProduct / pagination.limit));
    pagination.totalPage = totalPage;

    // 5. Tính startPage + endPage
    let startPage = currentPage - pagination.range;
    let endPage = currentPage + pagination.range;

    if (startPage < 1) {
        startPage = 1;
        endPage = Math.min(totalPage, startPage + pagination.range * 2);
    }

    if (endPage > totalPage) {
        endPage = totalPage;
        startPage = Math.max(1, endPage - pagination.range * 2);
    }

    pagination.startPage = startPage;
    pagination.endPage = endPage;

    return pagination;
};