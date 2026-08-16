# Quota Monitor Template

Template `Kode.gs` code for tracking free-tier quota usage across hybrid stack services. Adapt to your specific pattern.

---

## QuotaMonitor.gs

```javascript
/**
 * QuotaMonitor — Track and alert on free-tier quota usage.
 *
 * Setup:
 * 1. Create a Google Sheet named "Quota Monitor" with columns:
 *    A: Timestamp, B: Service, C: Metric, D: Used, E: Limit, F: Percent, G: Status
 * 2. Set QUOTA_SHEET_ID in Script Properties.
 * 3. Set ALERT_EMAIL in Script Properties.
 * 4. Create a daily time-driven trigger for `runQuotaCheck`.
 */

// ─── Configuration ─────────────────────────────────────────────

const QUOTA_CONFIG = {
  urlFetchApp: {
    service: 'Google Apps Script',
    metric: 'UrlFetchApp calls',
    dailyLimit: 20000, // Consumer account
    propertyKey: 'quota_urlfetch_count',
  },
  firestoreReads: {
    service: 'Firebase Firestore',
    metric: 'Document reads',
    dailyLimit: 50000,
    propertyKey: 'quota_firestore_reads',
  },
  firestoreWrites: {
    service: 'Firebase Firestore',
    metric: 'Document writes',
    dailyLimit: 20000,
    propertyKey: 'quota_firestore_writes',
  },
  upstashCommands: {
    service: 'Upstash Redis',
    metric: 'Commands',
    monthlyLimit: 500000,
    propertyKey: 'quota_upstash_commands',
  },
  cloudflareWorkers: {
    service: 'Cloudflare Workers',
    metric: 'Requests',
    dailyLimit: 100000,
    propertyKey: 'quota_cf_workers',
  },
  cloudflareKvReads: {
    service: 'Cloudflare KV',
    metric: 'Reads',
    dailyLimit: 100000,
    propertyKey: 'quota_cf_kv_reads',
  },
  supabaseEgress: {
    service: 'Supabase',
    metric: 'Egress (bytes)',
    monthlyLimit: 5 * 1024 * 1024 * 1024, // 5 GB
    propertyKey: 'quota_supabase_egress',
  },
};

const THRESHOLDS = {
  normal: 0.7,   // 70%
  warning: 0.9,  // 90%
  critical: 1.0, // 100%
};

// ─── Counter Functions (call these from your adapters) ─────────

/**
 * Increment a quota counter. Call this from every adapter method.
 * @param {string} configKey — Key from QUOTA_CONFIG.
 * @param {number} [amount=1] — Amount to increment.
 */
function incrementQuota(configKey, amount = 1) {
  const props = PropertiesService.getScriptProperties();
  const config = QUOTA_CONFIG[configKey];
  if (!config) return;

  const current = parseInt(props.getProperty(config.propertyKey) || '0', 10);
  props.setProperty(config.propertyKey, String(current + amount));
}

/**
 * Get current count for a quota metric.
 * @param {string} configKey — Key from QUOTA_CONFIG.
 * @returns {number}
 */
function getQuotaCount(configKey) {
  const props = PropertiesService.getScriptProperties();
  const config = QUOTA_CONFIG[configKey];
  if (!config) return 0;
  return parseInt(props.getProperty(config.propertyKey) || '0', 10);
}

/**
 * Reset all daily counters. Run this via a daily midnight trigger.
 */
function resetDailyQuotas() {
  const props = PropertiesService.getScriptProperties();
  Object.values(QUOTA_CONFIG).forEach(config => {
    if (config.dailyLimit) {
      props.setProperty(config.propertyKey, '0');
    }
  });
  Logger.log('Daily quotas reset at ' + new Date().toISOString());
}

/**
 * Reset all monthly counters. Run this via a monthly trigger (1st of each month).
 */
function resetMonthlyQuotas() {
  const props = PropertiesService.getScriptProperties();
  Object.values(QUOTA_CONFIG).forEach(config => {
    if (config.monthlyLimit) {
      props.setProperty(config.propertyKey, '0');
    }
  });
  Logger.log('Monthly quotas reset at ' + new Date().toISOString());
}

// ─── Check & Alert ─────────────────────────────────────────────

/**
 * Main quota check function. Set up a daily time-driven trigger for this.
 */
function runQuotaCheck() {
  const results = [];

  Object.entries(QUOTA_CONFIG).forEach(([key, config]) => {
    const used = getQuotaCount(key);
    const limit = config.dailyLimit || config.monthlyLimit;
    const percent = limit > 0 ? used / limit : 0;
    const status = getStatus_(percent);

    results.push({
      timestamp: new Date().toISOString(),
      service: config.service,
      metric: config.metric,
      used: used,
      limit: limit,
      percent: Math.round(percent * 100),
      status: status,
    });
  });

  logToSheet_(results);
  alertIfNeeded_(results);
}

/**
 * Determine status based on percentage.
 * @private
 */
function getStatus_(percent) {
  if (percent >= THRESHOLDS.critical) return '🔴 EXCEEDED';
  if (percent >= THRESHOLDS.warning) return '🟠 CRITICAL';
  if (percent >= THRESHOLDS.normal) return '🟡 WARNING';
  return '🟢 NORMAL';
}

/**
 * Log quota results to the monitoring spreadsheet.
 * @private
 */
function logToSheet_(results) {
  const sheetId = PropertiesService.getScriptProperties().getProperty('QUOTA_SHEET_ID');
  if (!sheetId) {
    Logger.log('QUOTA_SHEET_ID not set. Skipping sheet logging.');
    return;
  }

  try {
    const ss = SpreadsheetApp.openById(sheetId);
    let sheet = ss.getSheetByName('Quota Log');
    if (!sheet) {
      sheet = ss.insertSheet('Quota Log');
      sheet.appendRow(['Timestamp', 'Service', 'Metric', 'Used', 'Limit', 'Percent', 'Status']);
      sheet.getRange('1:1').setFontWeight('bold');
    }

    results.forEach(r => {
      sheet.appendRow([
        r.timestamp,
        r.service,
        r.metric,
        r.used,
        r.limit,
        r.percent + '%',
        r.status,
      ]);
    });

    // Keep only last 1000 rows to prevent sheet bloat
    const maxRows = 1001; // 1 header + 1000 data
    const totalRows = sheet.getLastRow();
    if (totalRows > maxRows) {
      sheet.deleteRows(2, totalRows - maxRows);
    }
  } catch (e) {
    Logger.log('Failed to log to sheet: ' + e.message);
  }
}

/**
 * Send email alert if any metric is at warning or above.
 * @private
 */
function alertIfNeeded_(results) {
  const alertEmail = PropertiesService.getScriptProperties().getProperty('ALERT_EMAIL');
  if (!alertEmail) {
    Logger.log('ALERT_EMAIL not set. Skipping email alerts.');
    return;
  }

  const warnings = results.filter(r => r.percent >= THRESHOLDS.normal * 100);
  if (warnings.length === 0) return;

  const subject = '⚠️ Hybrid Stack Quota Alert — ' +
    warnings.filter(w => w.status.includes('EXCEEDED')).length + ' exceeded, ' +
    warnings.filter(w => w.status.includes('CRITICAL')).length + ' critical';

  let body = 'Quota Status Report\n';
  body += '=' .repeat(50) + '\n\n';

  warnings.forEach(w => {
    body += `${w.status} ${w.service} — ${w.metric}\n`;
    body += `  Used: ${w.used.toLocaleString()} / ${w.limit.toLocaleString()} (${w.percent}%)\n\n`;
  });

  body += '\nAll metrics:\n';
  body += '-'.repeat(50) + '\n';
  results.forEach(r => {
    body += `${r.status} ${r.service} — ${r.metric}: ${r.percent}%\n`;
  });

  try {
    MailApp.sendEmail({
      to: alertEmail,
      subject: subject,
      body: body,
    });
    Logger.log('Alert email sent to ' + alertEmail);
  } catch (e) {
    Logger.log('Failed to send alert email: ' + e.message);
  }
}

// ─── Dashboard endpoint ────────────────────────────────────────

/**
 * Return quota status as JSON for a dashboard.
 * Call via doGet with ?action=quotaStatus.
 */
function getQuotaStatus() {
  const results = {};
  Object.entries(QUOTA_CONFIG).forEach(([key, config]) => {
    const used = getQuotaCount(key);
    const limit = config.dailyLimit || config.monthlyLimit;
    const percent = limit > 0 ? used / limit : 0;
    results[key] = {
      service: config.service,
      metric: config.metric,
      used: used,
      limit: limit,
      percent: Math.round(percent * 100),
      status: getStatus_(percent),
      type: config.dailyLimit ? 'daily' : 'monthly',
    };
  });
  return results;
}

// ─── Setup triggers ────────────────────────────────────────────

/**
 * One-time setup: create triggers for quota monitoring.
 * Run this manually once.
 */
function setupQuotaTriggers() {
  // Delete existing quota triggers
  ScriptApp.getProjectTriggers().forEach(trigger => {
    const handler = trigger.getHandlerFunction();
    if (['runQuotaCheck', 'resetDailyQuotas', 'resetMonthlyQuotas'].includes(handler)) {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  // Daily quota check at 23:00
  ScriptApp.newTrigger('runQuotaCheck')
    .timeBased()
    .everyDays(1)
    .atHour(23)
    .create();

  // Daily reset at midnight
  ScriptApp.newTrigger('resetDailyQuotas')
    .timeBased()
    .everyDays(1)
    .atHour(0)
    .create();

  // Monthly reset on day 1
  ScriptApp.newTrigger('resetMonthlyQuotas')
    .timeBased()
    .onMonthDay(1)
    .atHour(0)
    .create();

  Logger.log('Quota triggers created successfully.');
}
```

---

## Integration with adapters

In every adapter, call `incrementQuota()` after each API call:

```javascript
// Example: in FirestoreAdapter.gs
function firestoreGetDocument(collection, docId) {
  const url = `${FIRESTORE_URL}/${collection}/${docId}`;
  const response = UrlFetchApp.fetch(url, {
    headers: { 'Authorization': 'Bearer ' + getFirestoreToken_() },
    muteHttpExceptions: true,
  });

  // Track both UrlFetchApp and Firestore quotas
  incrementQuota('urlFetchApp');
  incrementQuota('firestoreReads');

  // ... handle response
}
```

---

## Setup instructions

1. Create a new Google Sheet for quota monitoring.
2. Set Script Properties:
   - `QUOTA_SHEET_ID` = the Sheet ID
   - `ALERT_EMAIL` = your email address
3. Run `setupQuotaTriggers()` once from the Apps Script editor.
4. Add `incrementQuota()` calls to all your adapter functions.
5. Customize `QUOTA_CONFIG` to match the services you actually use.
6. Remove unused service entries from `QUOTA_CONFIG`.
