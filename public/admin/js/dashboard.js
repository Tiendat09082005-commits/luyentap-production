(function() {
  function getCanvasData(id) {
    var canvas = document.getElementById(id);
    if (!canvas) return null;

    try {
      return {
        canvas: canvas,
        data: JSON.parse(canvas.dataset.chart || "null")
      };
    } catch (error) {
      return { canvas: canvas, data: null };
    }
  }

  function setupCanvas(canvas) {
    var dpr = window.devicePixelRatio || 1;
    var rect = canvas.getBoundingClientRect();
    var width = Math.max(320, Math.floor(rect.width || canvas.parentElement.clientWidth || 320));
    var height = 240;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.height = height + "px";
    canvas.style.width = width + "px";

    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, width: width, height: height };
  }

  function drawRevenueChart(payload) {
    if (!payload || !payload.data || !Array.isArray(payload.data.labels)) return;

    var canvas = payload.canvas;
    var chart = setupCanvas(canvas);
    var ctx = chart.ctx;
    var width = chart.width;
    var height = chart.height;
    var labels = payload.data.labels || [];
    var revenue = payload.data.revenue || [];
    var profit = payload.data.profit || [];
    var values = revenue.concat(profit).map(function(item) { return Number(item || 0); });
    var maxValue = Math.max.apply(null, values.concat([1]));
    var left = 38;
    var right = width - 18;
    var top = 18;
    var bottom = height - 34;
    var graphWidth = right - left;
    var graphHeight = bottom - top;
    var stepX = labels.length > 1 ? graphWidth / (labels.length - 1) : graphWidth;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#151820";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for (var i = 0; i <= 4; i += 1) {
      var y = top + (graphHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();
    }

    ctx.fillStyle = "#6b7394";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "right";
    for (var j = 0; j <= 4; j += 1) {
      var value = Math.round(maxValue - (maxValue / 4) * j);
      var labelY = top + (graphHeight / 4) * j + 4;
      ctx.fillText(value.toLocaleString("vi-VN"), left - 8, labelY);
    }

    function pointY(value) {
      return bottom - (Number(value || 0) / maxValue) * graphHeight;
    }

    function drawSeries(series, strokeColor, fillColor) {
      if (!series.length) return;

      ctx.beginPath();
      series.forEach(function(value, index) {
        var x = left + stepX * index;
        var y = pointY(value);
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      series.forEach(function(value, index) {
        var x = left + stepX * index;
        var y = pointY(value);
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = fillColor;
        ctx.fill();
      });
    }

    drawSeries(profit, "#00d4aa", "#00d4aa");
    drawSeries(revenue, "#4f7cff", "#4f7cff");

    ctx.textAlign = "center";
    ctx.fillStyle = "#6b7394";
    labels.forEach(function(label, index) {
      var x = left + stepX * index;
      ctx.fillText(label, x, height - 10);
    });
  }

  function drawStatusChart(payload) {
    if (!payload || !payload.data || !Array.isArray(payload.data)) return;

    var canvas = payload.canvas;
    var chart = setupCanvas(canvas);
    var ctx = chart.ctx;
    var width = chart.width;
    var height = chart.height;
    var total = payload.data.reduce(function(sum, item) {
      return sum + Number(item.total || 0);
    }, 0);
    var centerX = width / 2;
    var centerY = height / 2;
    var radius = Math.min(width, height) / 2 - 28;
    var innerRadius = radius * 0.62;
    var startAngle = -Math.PI / 2;

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#151820";
    ctx.fillRect(0, 0, width, height);

    if (!total) {
      ctx.fillStyle = "#6b7394";
      ctx.font = "14px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Chưa có dữ liệu", centerX, centerY);
      return;
    }

    payload.data.forEach(function(item) {
      var value = Number(item.total || 0);
      var slice = (value / total) * Math.PI * 2;
      var endAngle = startAngle + slice;

      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = item.color || "#4f7cff";
      ctx.fill();

      startAngle = endAngle;
    });

    ctx.fillStyle = "#e8eaf2";
    ctx.font = "700 24px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(total.toLocaleString("vi-VN"), centerX, centerY - 2);
    ctx.fillStyle = "#6b7394";
    ctx.font = "12px sans-serif";
    ctx.fillText("đơn hàng", centerX, centerY + 18);
  }

  function renderDashboardCharts() {
    drawRevenueChart(getCanvasData("revenueChart"));
    drawStatusChart(getCanvasData("statusChart"));
  }

  document.addEventListener("DOMContentLoaded", renderDashboardCharts);
  window.addEventListener("resize", renderDashboardCharts);
})();
