/**
 * Upstash Redis & QStash Adapter for Google Apps Script
 * Pattern E — GAS + Upstash Redis (Caching) + QStash (Job Queue)
 *
 * Prerequisites:
 * 1. Create a Redis database at https://console.upstash.com
 * 2. Create a QStash instance (same console).
 * 3. Store in Script Properties:
 *    - UPSTASH_REDIS_URL: https://your-redis.upstash.io
 *    - UPSTASH_REDIS_TOKEN: your Redis REST token
 *    - UPSTASH_QSTASH_TOKEN: your QStash token
 *    - GAS_DOPOST_URL: your deployed GAS web app URL (for QStash callbacks)
 */

// ─── Redis Configuration ───────────────────────────────────────

/**
 * Get Upstash Redis config.
 * @returns {{ url: string, token: string }}
 * @private
 */
function getUpstashRedisConfig_() {
  const props = PropertiesService.getScriptProperties();
  return {
    url: props.getProperty('UPSTASH_REDIS_URL'),
    token: props.getProperty('UPSTASH_REDIS_TOKEN'),
  };
}

/**
 * Execute a Redis command via REST API.
 * @param {string[]} command — Redis command as array, e.g., ['SET', 'key', 'value'].
 * @returns {*} Redis response.
 * @private
 */
function redisCommand_(command) {
  const config = getUpstashRedisConfig_();
  const url = config.url;

  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + config.token },
    payload: JSON.stringify(command),
    muteHttpExceptions: true,
  });

  incrementQuota('urlFetchApp');
  incrementQuota('upstashCommands');

  const code = response.getResponseCode();
  if (code !== 200) {
    throw new Error(`Upstash Redis error ${code}: ${response.getContentText()}`);
  }

  const result = JSON.parse(response.getContentText());
  if (result.error) throw new Error('Redis error: ' + result.error);
  return result.result;
}

// ─── Redis Key-Value Operations ────────────────────────────────

/**
 * Set a key-value pair with optional TTL.
 * @param {string} key
 * @param {*} value — Will be JSON-serialized if object.
 * @param {number} [ttlSeconds] — Time-to-live in seconds.
 */
function redisSet(key, value, ttlSeconds) {
  const serialized = typeof value === 'object' ? JSON.stringify(value) : String(value);
  const command = ['SET', key, serialized];
  if (ttlSeconds) command.push('EX', String(ttlSeconds));
  return redisCommand_(command);
}

/**
 * Get a value by key.
 * @param {string} key
 * @param {boolean} [parseJson=false] — Auto-parse JSON.
 * @returns {string|Object|null}
 */
function redisGet(key, parseJson = false) {
  const result = redisCommand_(['GET', key]);
  if (result === null) return null;
  if (parseJson) {
    try { return JSON.parse(result); } catch { return result; }
  }
  return result;
}

/**
 * Delete one or more keys.
 * @param {...string} keys
 * @returns {number} Number of keys deleted.
 */
function redisDel(...keys) {
  return redisCommand_(['DEL', ...keys]);
}

/**
 * Check if a key exists.
 * @param {string} key
 * @returns {boolean}
 */
function redisExists(key) {
  return redisCommand_(['EXISTS', key]) === 1;
}

/**
 * Set expiry on existing key.
 * @param {string} key
 * @param {number} seconds
 */
function redisExpire(key, seconds) {
  return redisCommand_(['EXPIRE', key, String(seconds)]);
}

/**
 * Increment a numeric key (atomic).
 * @param {string} key
 * @param {number} [by=1]
 * @returns {number} New value.
 */
function redisIncr(key, by = 1) {
  if (by === 1) return redisCommand_(['INCR', key]);
  return redisCommand_(['INCRBY', key, String(by)]);
}

// ─── Redis Hash Operations ─────────────────────────────────────

/**
 * Set a hash field.
 * @param {string} key
 * @param {string} field
 * @param {*} value
 */
function redisHSet(key, field, value) {
  const serialized = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return redisCommand_(['HSET', key, field, serialized]);
}

/**
 * Get a hash field.
 * @param {string} key
 * @param {string} field
 * @returns {string|null}
 */
function redisHGet(key, field) {
  return redisCommand_(['HGET', key, field]);
}

/**
 * Get all hash fields and values.
 * @param {string} key
 * @returns {Object}
 */
function redisHGetAll(key) {
  const result = redisCommand_(['HGETALL', key]);
  // Result is a flat array: [field1, value1, field2, value2, ...]
  const obj = {};
  for (let i = 0; i < result.length; i += 2) {
    obj[result[i]] = result[i + 1];
  }
  return obj;
}

// ─── Caching Helpers ───────────────────────────────────────────

/**
 * Cache-aside pattern: get from cache, or compute and store.
 * @param {string} key — Cache key.
 * @param {Function} computeFn — Function to call on cache miss.
 * @param {number} [ttlSeconds=300] — Cache TTL.
 * @returns {*} Cached or computed value.
 */
function cacheOrCompute(key, computeFn, ttlSeconds = 300) {
  const cached = redisGet(key, true);
  if (cached !== null) return cached;

  const value = computeFn();
  redisSet(key, value, ttlSeconds);
  return value;
}

/**
 * Invalidate cache entries by prefix.
 * Note: SCAN is not available via REST API on free tier.
 * Use a key registry pattern instead.
 * @param {string} registryKey — Key that stores a list of cache keys.
 */
function invalidateCacheGroup(registryKey) {
  const keys = redisGet(registryKey, true);
  if (Array.isArray(keys)) {
    keys.forEach(key => redisDel(key));
    redisDel(registryKey);
  }
}

// ─── Rate Limiting ─────────────────────────────────────────────

/**
 * Simple sliding-window rate limiter.
 * @param {string} identifier — User ID or IP.
 * @param {number} maxRequests — Max requests per window.
 * @param {number} windowSeconds — Window duration.
 * @returns {boolean} True if allowed, false if rate-limited.
 */
function checkRateLimit(identifier, maxRequests, windowSeconds) {
  const key = `ratelimit:${identifier}`;
  const current = redisIncr(key);
  if (current === 1) {
    redisExpire(key, windowSeconds);
  }
  return current <= maxRequests;
}

// ─── QStash Job Queue ──────────────────────────────────────────

/**
 * Publish a message to QStash, which will call back to your GAS doPost.
 * Use this to break long-running tasks into chunks.
 * @param {Object} payload — Job data.
 * @param {Object} [options]
 * @param {number} [options.delay] — Delay in seconds before delivery.
 * @param {number} [options.retries=3] — Max retries on failure.
 * @returns {Object} QStash response with messageId.
 */
function qstashPublish(payload, options = {}) {
  const props = PropertiesService.getScriptProperties();
  const qstashToken = props.getProperty('UPSTASH_QSTASH_TOKEN');
  const callbackUrl = props.getProperty('GAS_DOPOST_URL');

  const headers = {
    Authorization: 'Bearer ' + qstashToken,
    'Content-Type': 'application/json',
    'Upstash-Retries': String(options.retries || 3),
  };

  if (options.delay) {
    headers['Upstash-Delay'] = `${options.delay}s`;
  }

  const response = UrlFetchApp.fetch(`https://qstash.upstash.io/v2/publish/${callbackUrl}`, {
    method: 'post',
    headers: headers,
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  incrementQuota('urlFetchApp');

  const code = response.getResponseCode();
  if (code !== 200 && code !== 202) {
    throw new Error(`QStash error ${code}: ${response.getContentText()}`);
  }

  return JSON.parse(response.getContentText());
}

/**
 * Handle a QStash callback in doPost.
 * Add this to your main doPost function.
 * @param {Object} e — The doPost event object.
 * @returns {boolean} True if this was a QStash message.
 */
function handleQStashCallback(e) {
  // QStash sends the Upstash-Signature header
  const signature = e.parameter['Upstash-Signature'] ||
    (e.postData && e.postData.contents ? 'qstash' : null);

  if (!signature) return false;

  try {
    const payload = JSON.parse(e.postData.contents);
    // Route to the appropriate handler based on payload.action
    const action = payload.action;
    if (action && typeof globalThis[action] === 'function') {
      globalThis[action](payload);
    } else {
      Logger.log('Unknown QStash action: ' + action);
    }
    return true;
  } catch (error) {
    Logger.log('QStash callback error: ' + error.message);
    return true; // Still return true to prevent retry loops
  }
}
