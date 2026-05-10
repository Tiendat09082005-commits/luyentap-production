/**
 * Universal Header Search Logic
 * Supports multiple entities and both Client/Admin contexts
 */

document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("headerSearchInput");
    const resultContainer = document.getElementById("searchResultContainer");

    if (!searchInput || !resultContainer) return;

    const entity = searchInput.dataset.searchEntity || "products";
    const isAdmin = searchInput.dataset.isAdmin === "true";

    // Preserve category when searching
    const headerSearchForm = document.getElementById("headerSearchForm");
    if (headerSearchForm) {
        const urlParams = new URLSearchParams(window.location.search);
        ["category", "minPrice", "maxPrice", "sortKey", "sortValue", "limit"].forEach((key) => {
            const currentValue = urlParams.get(key);
            if (!currentValue) return;

            let hiddenInput = headerSearchForm.querySelector(`input[name="${key}"]`);
            if (!hiddenInput) {
                hiddenInput = document.createElement("input");
                hiddenInput.type = "hidden";
                hiddenInput.name = key;
                headerSearchForm.appendChild(hiddenInput);
            }
            hiddenInput.value = currentValue;
        });
    }

    const searchSDK = new SearchSDK(entity, isAdmin);
    let debounceTimer;
    let lastKeyword = "";
    const extraParams = {};
    if (headerSearchForm) {
        const urlParams = new URLSearchParams(window.location.search);
        const currentCategory = urlParams.get("category");
        if (currentCategory) {
            extraParams.category = currentCategory;
        }
    }

    searchInput.addEventListener("input", (e) => {
        const keyword = e.target.value.trim();

        if (!keyword) {
            lastKeyword = "";
            hideResults();
            return;
        }

        if (keyword === lastKeyword) return;
        lastKeyword = keyword;

        clearTimeout(debounceTimer);
        renderLoading();

        debounceTimer = setTimeout(async () => {
            try {
                const results = await searchSDK.suggest(keyword, extraParams);

                if (keyword !== lastKeyword) return;

                if (results && results.length > 0) {
                    renderSuggestions(results, keyword, entity, isAdmin);
                } else {
                    renderNoResult();
                }
            } catch (err) {
                console.error("Search error:", err);
                hideResults();
            }
        }, 350);
    });

    document.addEventListener("click", (e) => {
        if (!searchInput.contains(e.target) && !resultContainer.contains(e.target)) {
            hideResults();
        }
    });

    function hideResults() {
        resultContainer.classList.remove("active");
        resultContainer.replaceChildren();
    }

    function renderLoading() {
        const loadingNode = document.createElement("div");
        loadingNode.className = "search-loading";
        loadingNode.textContent = "Dang tim...";

        resultContainer.replaceChildren(loadingNode);
        resultContainer.classList.add("active");
    }

    function renderSuggestions(items, keyword, entity, isAdmin) {
        const fragment = document.createDocumentFragment();

        items.forEach((item) => {
            const link = document.createElement("a");
            link.href = getDetailUrl(item, entity, isAdmin);
            link.className = "search-item";

            const thumbWrap = document.createElement("div");
            thumbWrap.className = "thumb-wrap";

            const image = document.createElement("img");
            image.src = item.thumbnail || item.avatar || "/client/images/no-image.png";
            image.alt = item.fullName || item.title || item.orderCode || "search-result";
            image.addEventListener("error", () => {
                image.src = "/client/images/no-image.png";
            });
            thumbWrap.appendChild(image);

            const info = document.createElement("div");
            info.className = "search-item-info";

            const subtitle = document.createElement("span");
            subtitle.className = "search-item-subtitle";
            subtitle.textContent = getSubtitle(item, entity);

            const title = document.createElement("span");
            title.className = "search-item-title";
            appendHighlightedText(
                title,
                item.fullName || item.title || item.orderCode || "No Name",
                keyword
            );

            info.appendChild(subtitle);
            info.appendChild(title);
            link.appendChild(thumbWrap);
            link.appendChild(info);
            fragment.appendChild(link);
        });

        resultContainer.replaceChildren(fragment);
        resultContainer.classList.add("active");
    }

    function appendHighlightedText(container, text, keyword) {
        const safeKeyword = keyword.toLowerCase();
        const sourceText = String(text || "");
        const lowerText = sourceText.toLowerCase();
        const matchIndex = lowerText.indexOf(safeKeyword);

        if (matchIndex === -1 || !safeKeyword) {
            container.textContent = sourceText;
            return;
        }

        const before = sourceText.slice(0, matchIndex);
        const match = sourceText.slice(matchIndex, matchIndex + keyword.length);
        const after = sourceText.slice(matchIndex + keyword.length);

        if (before) {
            container.appendChild(document.createTextNode(before));
        }

        const highlight = document.createElement("span");
        highlight.className = "highlight";
        highlight.textContent = match;
        container.appendChild(highlight);

        if (after) {
            container.appendChild(document.createTextNode(after));
        }
    }

    function getDetailUrl(item, entity, isAdmin) {
        const prefix = isAdmin ? "/admin" : "";
        if (entity === "products") return `${prefix}/products/detail/${item._id || item.slug}`;
        if (entity === "users") {
            return `/admin/accounts/user?keyword=${encodeURIComponent(item.fullName || item.email || "")}`;
        }
        if (entity === "orders") return `/admin/order/detail?order_id=${item._id}`;
        if (entity === "accounts") return `/admin/accounts/detail/${item._id}`;
        return "#";
    }

    function getSubtitle(item, entity) {
        if (entity === "products") return "San pham";
        if (entity === "users") return item.email || "Nguoi dung";
        if (entity === "accounts") return item.email || "Tai khoan";
        if (entity === "orders") {
            return `Tong tien: ${(item.totalPrice || 0).toLocaleString()}d`;
        }
        return "";
    }

    function renderNoResult() {
        const emptyNode = document.createElement("div");
        emptyNode.className = "search-no-result";
        emptyNode.textContent = "Khong tim thay ket qua";

        resultContainer.replaceChildren(emptyNode);
        resultContainer.classList.add("active");
    }
});
