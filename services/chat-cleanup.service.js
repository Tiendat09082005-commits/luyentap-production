const cron = require("node-cron");
const Conversation = require("../models/conversation.model");
const Message = require("../models/message.model");

class ChatCleanupService {
  constructor() {
    this.task = null;
    this.running = false;
    this.schedule = "0 2 * * *";
    this.timezone = process.env.CRON_TIMEZONE || "Asia/Ho_Chi_Minh";
    this.retentionDays = 30;
  }

  getCutoffDate() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - this.retentionDays);
    return cutoff;
  }

  async runCycle() {
    if (this.running) return;
    this.running = true;

    try {
      const cutoffDate = this.getCutoffDate();
      const staleConversations = await Conversation.find({
        $or: [
          { "lastMessage.sentAt": { $lt: cutoffDate } },
          { lastMessage: null, createdAt: { $lt: cutoffDate } },
        ],
      }).select("_id");

      const conversationIds = staleConversations.map((conversation) => conversation._id);

      if (!conversationIds.length) {
        console.log("[ChatCleanup] No stale conversations found.");
        return;
      }

      const [messageResult, conversationResult] = await Promise.all([
        Message.deleteMany({ conversationId: { $in: conversationIds } }),
        Conversation.deleteMany({ _id: { $in: conversationIds } }),
      ]);

      console.log(
        `[ChatCleanup] Deleted ${conversationResult.deletedCount || 0} conversations and ${messageResult.deletedCount || 0} messages.`
      );
    } catch (error) {
      console.error("[ChatCleanup] cycle failed:", error.message);
    } finally {
      this.running = false;
    }
  }

  start() {
    if (this.task) return;

    this.task = cron.schedule(this.schedule, () => {
      this.runCycle();
    }, {
      timezone: this.timezone,
    });

    console.log(`[ChatCleanup] Scheduled job at 02:00 daily (${this.timezone}).`);
  }

  stop() {
    if (!this.task) return;
    this.task.stop();
    this.task.destroy();
    this.task = null;
  }
}

module.exports = new ChatCleanupService();
