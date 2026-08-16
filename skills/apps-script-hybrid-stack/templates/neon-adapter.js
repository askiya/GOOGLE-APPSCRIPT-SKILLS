/**
 * Neon PostgreSQL Adapter for Google Apps Script
 * Pattern G — GAS + Neon Serverless PostgreSQL
 *
 * Prerequisites:
 * 1. Create a Neon project at https://neon.tech
 * 2. Create a database and get the connection string.
 * 3. Neon provides a serverless HTTP driver endpoint.
 * 4. Store in Script Properties:
 *    - NEON_HOST: your-project.neon.tech
 *    - NEON_DATABASE: your database name
 *    - NEON_USER: your database user
 *    - NEON_PASSWORD: your database password
 *
 * This adapter uses Neon's serverless driver HTTP endpoint
 * since Apps Script cannot make raw TCP/WebSocket connections.
 */

// ─── Configuration ─────────────────────────────────────────────

/**
 * Get Neon config from Script Properties.
 * @returns {{ host: string, database: string, user: string, password: string }}
 * @private
 */
function getNeonConfig_() {
  const props = PropertiesService.getScriptProperties();
  return {
    host: props.getProperty('NEON_HOST'),
    database: props.getProperty('NEON_DATABASE'),
    user: props.getProperty('NEON_USER'),
    password: props.getProperty('NEON_PASSWORD'),
  };
}

/**
 * Build the Neon serverless driver HTTP URL.
 * @returns {string}
 * @private
 */
function getNeonUrl_() {
  const config = getNeonConfig_();
  return `https://${config.host}/sql`;
}

// ─── Core Query Function ───────────────────────────────────────

/**
 * Execute a SQL query via Neon's serverless HTTP driver.
 * @param {string} sql — SQL statement with $1, $2, ... placeholders.
 * @param {Array} [params=[]] — Parameter values.
 * @returns {{ columns: string[], rows: Array[], rowCount: number }}
 */
function neonQuery(sql, params = []) {
  const config = getNeonConfig_();
  const url = getNeonUrl_();

  const authString = Utilities.base64Encode(`${config.user}:${config.password}`);

  const body = {
    query: sql,
    params: params,
  };

  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Neon-Connection-String': `postgresql://${config.user}:${config.password}@${config.host}/${config.database}?sslmode=require`,
    },
    payload: JSON.stringify(body),
    muteHttpExceptions: true,
  });

  incrementQuota('urlFetchApp');

  const code = response.getResponseCode();
  if (code !== 200) {
    throw new Error(`Neon error ${code}: ${response.getContentText()}`);
  }

  const result = JSON.parse(response.getContentText());

  if (result.error) {
    throw new Error('Neon SQL error: ' + result.error.message);
  }

  return {
    columns: result.fields ? result.fields.map(f => f.name) : [],
    rows: result.rows || [],
    rowCount: result.rowCount || 0,
  };
}

/**
 * Execute a SQL query and return rows as objects.
 * @param {string} sql
 * @param {Array} [params=[]]
 * @returns {Object[]} Array of row objects.
 */
function neonQueryObjects(sql, params = []) {
  const result = neonQuery(sql, params);
  return result.rows.map(row => {
    const obj = {};
    result.columns.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

/**
 * Execute multiple queries in a transaction.
 * @param {Array<{ sql: string, params?: Array }>} queries
 * @returns {Array} Results for each query.
 */
function neonTransaction(queries) {
  const results = [];

  // Start transaction
  neonQuery('BEGIN');

  try {
    for (const q of queries) {
      results.push(neonQuery(q.sql, q.params || []));
    }
    neonQuery('COMMIT');
  } catch (error) {
    neonQuery('ROLLBACK');
    throw new Error('Transaction failed: ' + error.message);
  }

  return results;
}

// ─── Convenience CRUD Helpers ──────────────────────────────────

/**
 * Select rows from a table.
 * @param {string} table
 * @param {Object} [options]
 * @param {string} [options.columns='*']
 * @param {string} [options.where] — WHERE clause with $1, $2 placeholders.
 * @param {Array} [options.params] — Values for WHERE placeholders.
 * @param {string} [options.orderBy]
 * @param {number} [options.limit]
 * @param {number} [options.offset]
 * @returns {Object[]}
 */
function neonSelect(table, options = {}) {
  let sql = `SELECT ${options.columns || '*'} FROM ${table}`;
  const params = [];

  if (options.where) {
    sql += ` WHERE ${options.where}`;
    if (options.params) params.push(...options.params);
  }
  if (options.orderBy) sql += ` ORDER BY ${options.orderBy}`;
  if (options.limit) sql += ` LIMIT ${options.limit}`;
  if (options.offset) sql += ` OFFSET ${options.offset}`;

  return neonQueryObjects(sql, params);
}

/**
 * Insert a row and return it.
 * @param {string} table
 * @param {Object} data — { column: value, ... }
 * @returns {Object} Inserted row.
 */
function neonInsert(table, data) {
  const columns = Object.keys(data);
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;

  const result = neonQueryObjects(sql, Object.values(data));
  return result[0] || null;
}

/**
 * Update rows and return updated rows.
 * @param {string} table
 * @param {Object} data — Fields to update.
 * @param {string} where — WHERE clause with $N placeholders (numbering continues after data params).
 * @param {Array} whereParams
 * @returns {Object[]} Updated rows.
 */
function neonUpdate(table, data, where, whereParams = []) {
  const dataKeys = Object.keys(data);
  const dataValues = Object.values(data);
  const setClauses = dataKeys.map((col, i) => `${col} = $${i + 1}`).join(', ');

  // Renumber WHERE placeholders
  const offset = dataKeys.length;
  const adjustedWhere = where.replace(/\$(\d+)/g, (_, n) => `$${parseInt(n) + offset}`);

  const sql = `UPDATE ${table} SET ${setClauses} WHERE ${adjustedWhere} RETURNING *`;
  return neonQueryObjects(sql, [...dataValues, ...whereParams]);
}

/**
 * Upsert (INSERT ... ON CONFLICT ... UPDATE).
 * @param {string} table
 * @param {Object} data
 * @param {string} conflictColumn — Column with UNIQUE constraint.
 * @returns {Object} Upserted row.
 */
function neonUpsert(table, data, conflictColumn) {
  const columns = Object.keys(data);
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
  const updateClauses = columns
    .filter(c => c !== conflictColumn)
    .map(c => `${c} = EXCLUDED.${c}`)
    .join(', ');

  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})
    ON CONFLICT (${conflictColumn}) DO UPDATE SET ${updateClauses}
    RETURNING *`;

  const result = neonQueryObjects(sql, Object.values(data));
  return result[0] || null;
}

/**
 * Delete rows.
 * @param {string} table
 * @param {string} where — WHERE clause.
 * @param {Array} params
 * @returns {Object[]} Deleted rows.
 */
function neonDeleteRows(table, where, params = []) {
  const sql = `DELETE FROM ${table} WHERE ${where} RETURNING *`;
  return neonQueryObjects(sql, params);
}

// ─── Schema Helpers ────────────────────────────────────────────

/**
 * List all tables in the public schema.
 * @returns {string[]} Table names.
 */
function neonListTables() {
  const rows = neonQueryObjects(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`
  );
  return rows.map(r => r.table_name);
}

/**
 * Get column information for a table.
 * @param {string} table
 * @returns {Object[]} Column details.
 */
function neonDescribeTable(table) {
  return neonQueryObjects(
    `SELECT column_name, data_type, is_nullable, column_default
     FROM information_schema.columns
     WHERE table_name = $1 AND table_schema = 'public'
     ORDER BY ordinal_position`,
    [table]
  );
}
