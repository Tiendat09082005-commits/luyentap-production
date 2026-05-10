const paymentService = require("./payment.service");

class PaymentMaintenanceService {
  constructor() {
    this.interval = null;
    this.running = false;
    this.intervalMs = Number(process.env.PAYMENT_MAINTENANCE_INTERVAL_MS || 60000);
  }

  async runCycle() {
    if (this.running) return;
    this.running = true;

    try {
      await paymentService.expireTimedOutOrders();
      await paymentService.reconcilePendingOrders();
    } catch (error) {
      console.error("[PaymentMaintenance] cycle failed:", error.message);
    } finally {
      this.running = false;
    }
  }

  start() {
    if (this.interval) return;
    this.interval = setInterval(() => {
      this.runCycle();
    }, this.intervalMs);
    this.runCycle();
  }

  stop() {
    if (!this.interval) return;
    clearInterval(this.interval);
    this.interval = null;
  }
}

module.exports = new PaymentMaintenanceService();
