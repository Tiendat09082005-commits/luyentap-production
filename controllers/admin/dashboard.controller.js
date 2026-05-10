const dashboardService = require("../../services/admin/dashboard.service");

module.exports.index = async (req, res) => {
  try {
    const dashboard = await dashboardService.getDashboardData(
      req.dashboardQuery || { period: "month", recentLimit: 8, topLimit: 5 }
    );

    res.render("admin/pages/dashboard/index.pug", {
      pageTitle: "Dashboard Admin",
      dashboard
    });
  } catch (error) {
    console.error("DASHBOARD ERROR:", error);
    req.flash("error", "Không thể tải dữ liệu dashboard");
    res.render("admin/pages/dashboard/index.pug", {
      pageTitle: "Dashboard Admin",
      dashboard: {
        filters: {
          period: "month",
          periodLabel: "30 ngày qua",
          recentLimit: 8,
          topLimit: 5
        },
        overviewCards: [],
        revenueChart: { labels: [], revenue: [], profit: [], summary: "0đ" },
        statusDistribution: [],
        recentOrders: [],
        topProducts: [],
        currentDateLabel: new Date().toLocaleDateString("vi-VN")
      }
    });
  }
};
