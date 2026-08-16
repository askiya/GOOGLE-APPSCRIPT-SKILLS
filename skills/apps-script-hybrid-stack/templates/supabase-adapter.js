/**
 * Supabase Adapter for Google Apps Script
 * Pattern B — GAS + Supabase PostgreSQL (Free Plan)
 *
 * Prerequisites:
 * 1. Create a Supabase project at https://supabase.com
 * 2. Store in Script Properties:
 *    - SUPABASE_URL: https://your-project.supabase.co
 *    - SUPABASE_ANON_KEY: public anon key (for RLS-protected queries)
 *    - SUPABASE_SERVICE_KEY: service role key (bypasses RLS, server-side only)
 */

// ─── Configuration ─────────────────────────────────────────────

/**
 * Get Supabase config from Script Properties.
 * @returns {{ url: string, anonKey: string, serviceKey: string }}
 * @private
 */
function getSupabaseConfig_() {
  const props = PropertiesService.getScriptProperties();
  return {
    url: props.getProperty('SUPABASE_URL'),
    anonKey: props.getProperty('SUPABASE_ANON_KEY'),
    serviceKey: props.getProperty('SUPABASE_SERVICE_KEY'),
  };
}

/**
 * Make a request to Supabase PostgREST API.
 * @param {string} path — API path (e.g., '/rest/v1/users').
 * @param {Object} options — Fetch options.
 * @param {boolean} [useServiceKey=true] — Use service role key (bypasses RLS).
 * @returns {Object} Parsed JSON response.
 * @private
 */
function supabaseFetch_(path, options = {}, useServiceKey = true) {
  const config = getSupabaseConfig_();
  const url = config.url + path;
  const key = useServiceKey ? config.serviceKey : config.anonKey;

  const fetchOptions = {
    method: options.method || 'get',
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      Prefer: options.prefer || 'return=representation',
      ...options.headers,
    },
    muteHttpExceptions: true,
  };

  if (options.payload) {
    fetchOptions.payload = JSON.stringify(options.payload);
  }

  const response = UrlFetchApp.fetch(url, fetchOptions);
  incrementQuota('urlFetchApp');

  const code = response.getResponseCode();
  const body = response.getContentText();

  if (code < 200 || code >= 300) {
    throw new Error(`Supabase error ${code}: ${body}`);
  }

  return body ? JSON.parse(body) : null;
}

// ─── CRUD Operations ───────────────────────────────────────────

/**
 * Select rows from a table with optional filters.
 * @param {string} table — Table name.
 * @param {Object} [options] — Query options.
 * @param {string} [options.select='*'] — Columns to select.
 * @param {Object} [options.filters] — PostgREST filters: { column: 'eq.value' }.
 * @param {string} [options.order] — Order: 'column.asc' or 'column.desc'.
 * @param {number} [options.limit] — Max rows.
 * @param {number} [options.offset] — Offset for pagination.
 * @returns {Object[]} Array of row objects.
 */
function supabaseSelect(table, options = {}) {
  let path = `/rest/v1/${table}?select=${encodeURIComponent(options.select || '*')}`;

  if (options.filters) {
    Object.entries(options.filters).forEach(([col, filter]) => {
      path += `&${col}=${encodeURIComponent(filter)}`;
    });
  }
  if (options.order) path += `&order=${encodeURIComponent(options.order)}`;
  if (options.limit) path += `&limit=${options.limit}`;
  if (options.offset) path += `&offset=${options.offset}`;

  return supabaseFetch_(path);
}

/**
 * Insert one or more rows.
 * @param {string} table — Table name.
 * @param {Object|Object[]} rows — Row(s) to insert.
 * @returns {Object[]} Inserted rows.
 */
function supabaseInsert(table, rows) {
  return supabaseFetch_(`/rest/v1/${table}`, {
    method: 'post',
    payload: Array.isArray(rows) ? rows : [rows],
    prefer: 'return=representation',
  });
}

/**
 * Update rows matching filters.
 * @param {string} table — Table name.
 * @param {Object} filters — PostgREST filters: { column: 'eq.value' }.
 * @param {Object} updates — Fields to update.
 * @returns {Object[]} Updated rows.
 */
function supabaseUpdate(table, filters, updates) {
  let path = `/rest/v1/${table}?`;
  Object.entries(filters).forEach(([col, filter]) => {
    path += `${col}=${encodeURIComponent(filter)}&`;
  });

  return supabaseFetch_(path, {
    method: 'patch',
    payload: updates,
    prefer: 'return=representation',
  });
}

/**
 * Upsert (insert or update on conflict) rows.
 * @param {string} table — Table name.
 * @param {Object|Object[]} rows — Row(s) to upsert.
 * @param {string} [onConflict] — Conflict column(s), e.g., 'id'.
 * @returns {Object[]} Upserted rows.
 */
function supabaseUpsert(table, rows, onConflict) {
  let path = `/rest/v1/${table}`;
  if (onConflict) path += `?on_conflict=${encodeURIComponent(onConflict)}`;

  return supabaseFetch_(path, {
    method: 'post',
    payload: Array.isArray(rows) ? rows : [rows],
    prefer: 'return=representation,resolution=merge-duplicates',
  });
}

/**
 * Delete rows matching filters.
 * @param {string} table — Table name.
 * @param {Object} filters — PostgREST filters.
 * @returns {Object[]} Deleted rows.
 */
function supabaseDelete(table, filters) {
  let path = `/rest/v1/${table}?`;
  Object.entries(filters).forEach(([col, filter]) => {
    path += `${col}=${encodeURIComponent(filter)}&`;
  });

  return supabaseFetch_(path, {
    method: 'delete',
    prefer: 'return=representation',
  });
}

/**
 * Call a PostgreSQL function (RPC).
 * @param {string} funcName — Function name.
 * @param {Object} params — Function parameters.
 * @returns {*} Function result.
 */
function supabaseRpc(funcName, params = {}) {
  return supabaseFetch_(`/rest/v1/rpc/${funcName}`, {
    method: 'post',
    payload: params,
  });
}

// ─── Keep-alive ping ───────────────────────────────────────────

/**
 * Ping Supabase to prevent inactivity pause.
 * Set up a time-driven trigger every 6 days.
 */
function supabaseKeepAlive() {
  try {
    const result = supabaseRpc('now'); // PostgreSQL now() via RPC
    Logger.log('Supabase keep-alive OK: ' + JSON.stringify(result));
  } catch (e) {
    // Fallback: try a simple select
    try {
      supabaseFetch_('/rest/v1/?limit=1');
      Logger.log('Supabase keep-alive OK (fallback)');
    } catch (e2) {
      Logger.log('Supabase keep-alive FAILED: ' + e2.message);
    }
  }
}

// ─── Supabase Auth helpers ─────────────────────────────────────

/**
 * Sign up a user with email/password.
 * @param {string} email
 * @param {string} password
 * @returns {Object} Auth response with user and session.
 */
function supabaseSignUp(email, password) {
  return supabaseFetch_('/auth/v1/signup', {
    method: 'post',
    payload: { email, password },
  }, false); // Use anon key for auth
}

/**
 * Sign in a user with email/password.
 * @param {string} email
 * @param {string} password
 * @returns {Object} Auth response with access_token and refresh_token.
 */
function supabaseSignIn(email, password) {
  return supabaseFetch_('/auth/v1/token?grant_type=password', {
    method: 'post',
    payload: { email, password },
  }, false);
}

// ─── Manual backup ─────────────────────────────────────────────

/**
 * Export a table to Google Drive as JSON backup.
 * Supabase free plan has no automatic backups.
 * Set up a weekly time-driven trigger.
 * @param {string} table — Table name.
 * @param {string} folderId — Google Drive folder ID for backups.
 */
function supabaseBackupTable(table, folderId) {
  const rows = supabaseSelect(table, { limit: 10000 });
  const json = JSON.stringify(rows, null, 2);
  const fileName = `backup_${table}_${new Date().toISOString().split('T')[0]}.json`;

  const folder = DriveApp.getFolderById(folderId);
  folder.createFile(fileName, json, MimeType.PLAIN_TEXT);
  Logger.log(`Backed up ${rows.length} rows from ${table} to ${fileName}`);
}
