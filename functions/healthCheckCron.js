/**
 * Scheduled Cloud Function healthCheckCron
 * Pings BigiSub API every 15 minutes, updates admin_settings/vtu.lastHealthCheckStatus,
 * and logs failures to admin_stats/provider.
 */

module.exports = require('./src/admin/healthCheckCron');
