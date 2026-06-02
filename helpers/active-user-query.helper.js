function withActiveUserStatus(query = {}) {
  return {
    ...query,
    deleted: false,
    $or: [
      { status: "active" },
      { status: { $exists: false } },
      { status: null },
      { status: "" },
    ],
  };
}

module.exports = {
  withActiveUserStatus,
};
