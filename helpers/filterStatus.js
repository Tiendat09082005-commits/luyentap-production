module.exports = (queryOrStatus) => {
    let currentStatus = "";
    
    if (typeof queryOrStatus === "object") {
        currentStatus = queryOrStatus.status || "";
    } else {
        currentStatus = queryOrStatus || "";
    }

    const filterStatus = [
        { name: "Tất cả", status: "" },
        { name: "Hoạt động", status: "active" },
        { name: "Bị khóa", status: "inactive" },
        { name: "Đã xóa", status: "deleted" }
    ];

    return filterStatus.map(item => ({
        ...item,
        class: item.status === currentStatus ? "active" : ""
    }));
};