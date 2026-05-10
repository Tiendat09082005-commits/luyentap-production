const Order = require("../../models/order.model");
const Product = require("../../models/products.model");
const User = require("../../models/user.model");

const PERIOD_LABELS = {
  week: "7 ngày qua",
  month: "30 ngày qua",
  year: "12 tháng qua"
};

const STATUS_META = {
  completed: { label: "Hoàn thành", color: "#22c55e" },
  pending: { label: "Chờ xử lý", color: "#ffd166" },
  shipping: { label: "Đang giao", color: "#4f7cff" },
  cancelled: { label: "Đã hủy", color: "#ef4444" }
};

const ORDER_STATUS_TO_UI = {
  "đã giao": "completed",
  "đang giao": "shipping",
  "đã hủy": "cancelled",
  "đã xác nhận": "pending",
  "chờ xác nhận": "pending"
};

const formatCurrencyCompact = (value) => {
  const amount = Number(value || 0);
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(1).replace(/\.0$/, "")} tỷ`;
  }
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1).replace(/\.0$/, "")}tr`;
  }
  return `${amount.toLocaleString("vi-VN")}đ`;
};

const formatNumber = (value) => Number(value || 0).toLocaleString("vi-VN");

const buildTrend = (current, previous, period) => {
  const curr = Number(current || 0);
  const prev = Number(previous || 0);
  const diff = curr - prev;
  const direction = diff >= 0 ? "up" : "down";
  const base = prev === 0 ? (curr > 0 ? 100 : 0) : Math.abs((diff / prev) * 100);
  const formattedPercent = `${base.toFixed(base >= 10 ? 1 : 0)}%`;
  const sign = diff >= 0 ? "▲" : "▼";

  return {
    trend: direction,
    trendText: `${sign} ${formattedPercent} so với ${PERIOD_LABELS[period].toLowerCase()} trước`
  };
};

const startOfDay = (date) => {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfDay = (date) => {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

const shiftDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const shiftMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

const getPeriodWindow = (period) => {
  const now = new Date();
  const end = endOfDay(now);

  if (period === "week") {
    const start = startOfDay(shiftDays(now, -6));
    const previousEnd = endOfDay(shiftDays(start, -1));
    const previousStart = startOfDay(shiftDays(previousEnd, -6));
    return { start, end, previousStart, previousEnd };
  }

  if (period === "year") {
    const start = startOfDay(shiftMonths(now, -11));
    start.setDate(1);
    const previousEnd = endOfDay(shiftDays(start, -1));
    const previousStart = startOfDay(shiftMonths(start, -12));
    previousStart.setDate(1);
    return { start, end, previousStart, previousEnd };
  }

  const start = startOfDay(shiftDays(now, -29));
  const previousEnd = endOfDay(shiftDays(start, -1));
  const previousStart = startOfDay(shiftDays(previousEnd, -29));
  return { start, end, previousStart, previousEnd };
};

const getTimelineBuckets = (period) => {
  const now = new Date();

  if (period === "week") {
    return Array.from({ length: 7 }, (_, index) => {
      const date = startOfDay(shiftDays(now, -(6 - index)));
      return {
        key: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
        label: `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`,
        start: date,
        end: endOfDay(date)
      };
    });
  }

  if (period === "year") {
    return Array.from({ length: 12 }, (_, index) => {
      const date = startOfDay(shiftMonths(now, -(11 - index)));
      date.setDate(1);
      const end = endOfDay(new Date(date.getFullYear(), date.getMonth() + 1, 0));
      return {
        key: `${date.getFullYear()}-${date.getMonth() + 1}`,
        label: `T${date.getMonth() + 1}`,
        start: date,
        end
      };
    });
  }

  return Array.from({ length: 30 }, (_, index) => {
    const date = startOfDay(shiftDays(now, -(29 - index)));
    return {
      key: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
      label: `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`,
      start: date,
      end: endOfDay(date)
    };
  });
};

const classifyOrderStatus = (status) => ORDER_STATUS_TO_UI[String(status || "").toLowerCase()] || "pending";

async function getOverviewCounts(window) {
  const baseOrderMatch = { deleted: false };
  const revenueMatch = {
    deleted: false,
    status: { $ne: "đã hủy" }
  };

  const [
    totalOrders,
    currentOrders,
    previousOrders,
    currentRevenue,
    previousRevenue,
    totalUsers,
    currentUsers,
    previousUsers,
    totalProducts,
    currentProducts,
    previousProducts,
    pendingOrders,
    currentPendingOrders,
    previousPendingOrders
  ] = await Promise.all([
    Order.countDocuments(baseOrderMatch),
    Order.countDocuments({ ...baseOrderMatch, createdAt: { $gte: window.start, $lte: window.end } }),
    Order.countDocuments({ ...baseOrderMatch, createdAt: { $gte: window.previousStart, $lte: window.previousEnd } }),
    Order.aggregate([
      { $match: { ...revenueMatch, createdAt: { $gte: window.start, $lte: window.end } } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } }
    ]),
    Order.aggregate([
      { $match: { ...revenueMatch, createdAt: { $gte: window.previousStart, $lte: window.previousEnd } } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } }
    ]),
    User.countDocuments({ deleted: false }),
    User.countDocuments({ deleted: false, createdAt: { $gte: window.start, $lte: window.end } }),
    User.countDocuments({ deleted: false, createdAt: { $gte: window.previousStart, $lte: window.previousEnd } }),
    Product.countDocuments({ deleted: false }),
    Product.countDocuments({ deleted: false, createdAt: { $gte: window.start, $lte: window.end } }),
    Product.countDocuments({ deleted: false, createdAt: { $gte: window.previousStart, $lte: window.previousEnd } }),
    Order.countDocuments({ deleted: false, status: { $in: ["chờ xác nhận", "đã xác nhận"] } }),
    Order.countDocuments({
      deleted: false,
      status: { $in: ["chờ xác nhận", "đã xác nhận"] },
      createdAt: { $gte: window.start, $lte: window.end }
    }),
    Order.countDocuments({
      deleted: false,
      status: { $in: ["chờ xác nhận", "đã xác nhận"] },
      createdAt: { $gte: window.previousStart, $lte: window.previousEnd }
    })
  ]);

  return {
    totalOrders,
    currentOrders,
    previousOrders,
    currentRevenue: currentRevenue[0]?.total || 0,
    previousRevenue: previousRevenue[0]?.total || 0,
    totalUsers,
    currentUsers,
    previousUsers,
    totalProducts,
    currentProducts,
    previousProducts,
    pendingOrders,
    currentPendingOrders,
    previousPendingOrders
  };
}

async function getRevenueChart(period) {
  const buckets = getTimelineBuckets(period);
  const match = {
    deleted: false,
    status: { $ne: "đã hủy" },
    createdAt: {
      $gte: buckets[0].start,
      $lte: buckets[buckets.length - 1].end
    }
  };

  const orders = await Order.find(match)
    .select("createdAt totalPrice")
    .lean();

  const points = buckets.map((bucket) => {
    const total = orders.reduce((sum, order) => {
      const createdAt = new Date(order.createdAt);
      if (createdAt >= bucket.start && createdAt <= bucket.end) {
        return sum + Number(order.totalPrice || 0);
      }
      return sum;
    }, 0);

    const profit = Math.round(total * 0.18);
    return {
      label: bucket.label,
      revenue: total,
      profit
    };
  });

  return {
    labels: points.map((item) => item.label),
    revenue: points.map((item) => item.revenue),
    profit: points.map((item) => item.profit),
    summary: formatCurrencyCompact(points.reduce((sum, item) => sum + item.revenue, 0))
  };
}

async function getStatusDistribution(window) {
  const rows = await Order.aggregate([
    {
      $match: {
        deleted: false,
        createdAt: { $gte: window.start, $lte: window.end }
      }
    },
    {
      $group: {
        _id: "$status",
        total: { $sum: 1 }
      }
    }
  ]);

  const counts = {
    completed: 0,
    pending: 0,
    shipping: 0,
    cancelled: 0
  };

  rows.forEach((row) => {
    const key = classifyOrderStatus(row._id);
    counts[key] += row.total;
  });

  return Object.entries(counts).map(([key, total]) => ({
    key,
    total,
    label: STATUS_META[key].label,
    color: STATUS_META[key].color
  }));
}

async function getRecentOrders(limit) {
  const orders = await Order.find({ deleted: false })
    .select("orderCode userInfo products totalPrice status paymentStatus createdAt")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return orders.map((order) => ({
    id: order.orderCode,
    customer: order.userInfo?.fullName || "Khách lẻ",
    product: order.products?.[0]?.title || "Không có sản phẩm",
    total: formatCurrencyCompact(order.totalPrice),
    status: classifyOrderStatus(order.status),
    statusLabel: STATUS_META[classifyOrderStatus(order.status)].label,
    paymentStatus: order.paymentStatus,
    createdAt: order.createdAt
  }));
}

async function getTopProducts(limit) {
  const rows = await Order.aggregate([
    {
      $match: {
        deleted: false,
        status: { $ne: "đã hủy" }
      }
    },
    { $unwind: "$products" },
    {
      $group: {
        _id: "$products.product_id",
        name: { $first: "$products.title" },
        sold: { $sum: "$products.quantity" },
        revenue: { $sum: { $multiply: ["$products.finalPrice", "$products.quantity"] } }
      }
    },
    { $sort: { sold: -1, revenue: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "productDoc"
      }
    },
    {
      $unwind: {
        path: "$productDoc",
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $lookup: {
        from: "products-category",
        localField: "productDoc.category_id",
        foreignField: "_id",
        as: "categoryDoc"
      }
    },
    {
      $unwind: {
        path: "$categoryDoc",
        preserveNullAndEmptyArrays: true
      }
    }
  ]);

  const highestSold = rows[0]?.sold || 1;
  return rows.map((row) => ({
    name: row.name || "Sản phẩm",
    cat: row.categoryDoc?.title || "Chưa phân loại",
    sold: row.sold || 0,
    soldText: formatNumber(row.sold || 0),
    width: Math.max(8, Math.round(((row.sold || 0) / highestSold) * 100))
  }));
}

async function getDashboardData(query) {
  const window = getPeriodWindow(query.period);
  const [
    overview,
    revenueChart,
    statusDistribution,
    recentOrders,
    topProducts
  ] = await Promise.all([
    getOverviewCounts(window),
    getRevenueChart(query.period),
    getStatusDistribution(window),
    getRecentOrders(query.recentLimit),
    getTopProducts(query.topLimit)
  ]);

  const overviewCards = [
    {
      icon: "📦",
      value: formatNumber(overview.totalOrders),
      label: "Tổng đơn hàng",
      ...buildTrend(overview.currentOrders, overview.previousOrders, query.period)
    },
    {
      icon: "💰",
      value: formatCurrencyCompact(overview.currentRevenue),
      label: `Doanh thu ${PERIOD_LABELS[query.period].toLowerCase()}`,
      ...buildTrend(overview.currentRevenue, overview.previousRevenue, query.period)
    },
    {
      icon: "👤",
      value: formatNumber(overview.totalUsers),
      label: "Tổng người dùng",
      ...buildTrend(overview.currentUsers, overview.previousUsers, query.period)
    },
    {
      icon: "🛍️",
      value: formatNumber(overview.totalProducts),
      label: "Tổng sản phẩm",
      ...buildTrend(overview.currentProducts, overview.previousProducts, query.period)
    },
    {
      icon: "⏳",
      value: formatNumber(overview.pendingOrders),
      label: "Đơn chờ xử lý",
      ...buildTrend(overview.currentPendingOrders, overview.previousPendingOrders, query.period)
    }
  ];

  const currentDateLabel = new Date().toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

  return {
    filters: {
      period: query.period,
      periodLabel: PERIOD_LABELS[query.period],
      recentLimit: query.recentLimit,
      topLimit: query.topLimit
    },
    overviewCards,
    revenueChart,
    statusDistribution,
    recentOrders,
    topProducts,
    currentDateLabel
  };
}

module.exports = {
  getDashboardData
};
