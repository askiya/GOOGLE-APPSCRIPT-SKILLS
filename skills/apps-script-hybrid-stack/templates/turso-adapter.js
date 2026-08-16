/**
 * Turso Adapter for Google Apps Script
 * Pattern D — GAS + Turso (libSQL/SQLite Edge Database)
 *
 * Prerequisites:
 * 1. Install Turso CLI: curl -sSfL https://get.tur.so/install.sh | bash
 * 2. Create a database: turso db create myapp
 * 3. Get the HTTP URL: turso db show myapp --url
 * 4. Create a token: turso db tokens create myapp
 * 5. Store in Script Properties:
 *    - TURSO_URL: https://your-db-your-org.turso.io
 *    - TURSO_AUTH_TOKEN: your auth token
 */

// ─── Configuration ─────────────────────────────────────────────

/**
 * Get Turso config from Script Properties.
 * @returns {{ url: string, token: string }}
 * @private
 */
function getTursoConfig_() {
  const props = PropertiesService.getScriptProperties();
  return {
    url: props.getProperty('TURSO_URL'),
    token: props.getProperty('TURSO_AUTH_TOKEN'),
  };
}

// ─── Core Query Function ───────────────────────────────────────

/**
 * Execute a SQL statement via Turso HTTP API.
 * @param {string} sql — SQL statement.
 * @param {Array} [args=[]] — Positional arguments for parameterized queries.
 * @returns {{ columns: string[], rows: Array[], rowsAffected: number }}
 */
function tursoExecute(sql, args = []) {
  const config = getTursoConfig_();
  const url = config.url + '/v2/pipeline';

  const body = {
    requests: [
      { type: 'execute', stmt: { sql, args: formatTursoArgs_(args) } },
      { type: 'close' },
    ],
  };

  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + config.token },
    payload: JSON.stringify(body),
    muteHttpExceptions: true,
  });

  incrementQuota('urlFetchApp');

  const code = response.getResponseCode();
  if (code !== 200) {
    throw new Error(`Turso error ${code}: ${response.getContentText()}`);
  }

  const result = JSON.parse(response.getContentText());

  // Check for errors in the pipeline response
  if (result.results && result.results[0] && result.results[0].type === 'error') {
    throw new Error('Turso SQL error: ' + JSON.stringify(result.results[0].error));
  }

  const execResult = result.results[0].response.result;
  return {
    columns: execResult.cols.map(c => c.name),
    rows: execResult.rows.map(row => row.map(cell => cell.value)),
    rowsAffected: execResult.affected_row_count || 0,
  };
}

/**
 * Execute multiple SQL statements in a single pipeline (batch).
 * @param {Array<{ sql: string, args?: Array }>} statements
 * @returns {Array} Results for each statement.
 */
function tursoBatch(statements) {
  const config = getTursoConfig_();
  const url = config.url + '/v2/pipeline';

  const requests = statements.map(stmt => ({
    type: 'execute',
    stmt: { sql: stmt.sql, args: formatTursoArgs_(stmt.args || []) },
  }));
  requests.push({ type: 'close' });

  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + config.token },
    payload: JSON.stringify({ requests }),
    muteHttpExceptions: true,
  });

  incrementQuota('urlFetchApp');

  const code = response.getResponseCode();
  if (code !== 200) {
    throw new Error(`Turso batch error ${code}: ${response.getContentText()}`);
  }

  const result = JSON.parse(response.getContentText());
  return result.results
    .filter(r => r.type === 'ok')
    .map(r => {
      const execResult = r.response.result;
      return {
        columns: execResult.cols.map(c => c.name),
        rows: execResult.rows.map(row => row.map(cell => cell.value)),
        rowsAffected: execResult.affected_row_count || 0,
      };
    });
}

// ─── Convenience CRUD Helpers ──────────────────────────────────

/**
 * Select rows from a table.
 * @param {string} table — Table name.
 * @param {Object} [options]
 * @param {string} [options.where] — WHERE clause (e.g., 'status = ?').
 * @param {Array} [options.args] — Arguments for WHERE clause.
 * @param {string} [options.orderBy] — ORDER BY clause.
 * @param {number} [options.limit] — LIMIT.
 * @returns {Object[]} Array of row objects.
 */
function tursoSelect(table, options = {}) {
  let sql = `SELECT * FROM ${table}`;
  const args = [];

  if (options.where) {
    sql += ` WHERE ${options.where}`;
    if (options.args) args.push(...options.args);
  }
  if (options.orderBy) sql += ` ORDER BY ${options.orderBy}`;
  if (options.limit) sql += ` LIMIT ${options.limit}`;

  const result = tursoExecute(sql, args);
  return result.rows.map(row => {
    const obj = {};
    result.columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

/**
 * Insert a row.
 * @param {string} table
 * @param {Object} data — { column: value, ... }
 * @returns {{ rowsAffected: number }}
 */
function tursoInsert(table, data) {
  const columns = Object.keys(data);
  const placeholders = columns.map(() => '?').join(', ');
  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
  return tursoExecute(sql, Object.values(data));
}

/**
 * Update rows.
 * @param {string} table
 * @param {Object} data — Fields to update.
 * @param {string} where — WHERE clause.
 * @param {Array} whereArgs — WHERE arguments.
 * @returns {{ rowsAffected: number }}
 */
function tursoUpdate(table, data, where, whereArgs = []) {
  const setClauses = Object.keys(data).map(col => `${col} = ?`).join(', ');
  const sql = `UPDATE ${table} SET ${setClauses} WHERE ${where}`;
  return tursoExecute(sql, [...Object.values(data), ...whereArgs]);
}

/**
 * Delete rows.
 * @param {string} table
 * @param {string} where — WHERE clause.
 * @param {Array} whereArgs
 * @returns {{ rowsAffected: number }}
 */
function tursoDeleteRows(table, where, whereArgs = []) {
  const sql = `DELETE FROM ${table} WHERE ${where}`;
  return tursoExecute(sql, whereArgs);
}

// ─── Helpers ───────────────────────────────────────────────────

/**
 * Format arguments for Turso HTTP API.
 * @param {Array} args
 * @returns {Array}
 * @private
 */
function formatTursoArgs_(args) {
  return args.map(arg => {
    if (arg === null || arg === undefined) return { type: 'null', value: null };
    if (typeof arg === 'number') {
      return Number.isInteger(arg)
        ? { type: 'integer', value: String(arg) }
        : { type: 'float', value: arg };
    }
    if (typeof arg === 'string') return { type: 'text', value: arg };
    if (arg instanceof Uint8Array) return { type: 'blob', base64: Utilities.base64Encode(arg) };
    return { type: 'text', value: String(arg) };
  });
}
