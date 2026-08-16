/**
 * Firebase Firestore Adapter for Google Apps Script
 * Pattern A — GAS + Firebase Firestore (Spark Plan)
 *
 * Prerequisites:
 * 1. Create a Service Account in Google Cloud Console.
 * 2. Grant it "Cloud Datastore Owner" role.
 * 3. Download the JSON key file.
 * 4. Store in Script Properties:
 *    - FIRESTORE_PROJECT_ID: your Firebase project ID
 *    - FIRESTORE_CLIENT_EMAIL: service account email
 *    - FIRESTORE_PRIVATE_KEY: the private key (PEM format, with \n)
 *
 * This template uses raw UrlFetchApp. For a simpler API, consider the
 * FirestoreGoogleAppsScript community library.
 */

// ─── Configuration ─────────────────────────────────────────────

const FIRESTORE_BASE_URL_ = 'https://firestore.googleapis.com/v1';

/**
 * Get cached access token or generate a new one.
 * Tokens are cached for 55 minutes (they expire in 60).
 * @returns {string} OAuth 2.0 access token.
 * @private
 */
function getFirestoreToken_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('firestore_access_token');
  if (cached) return cached;

  const props = PropertiesService.getScriptProperties();
  const clientEmail = props.getProperty('FIRESTORE_CLIENT_EMAIL');
  const privateKey = props.getProperty('FIRESTORE_PRIVATE_KEY').replace(/\\n/g, '\n');

  const now = Math.floor(Date.now() / 1000);
  const claimSet = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };

  const header = Utilities.base64EncodeWebSafe(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = Utilities.base64EncodeWebSafe(JSON.stringify(claimSet));
  const signatureInput = header + '.' + claim;

  const signature = Utilities.base64EncodeWebSafe(
    Utilities.computeRsaSha256Signature(signatureInput, privateKey)
  );

  const jwt = signatureInput + '.' + signature;

  const tokenResponse = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    payload: {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    },
    muteHttpExceptions: true,
  });

  if (tokenResponse.getResponseCode() !== 200) {
    throw new Error('Firestore auth failed: ' + tokenResponse.getContentText());
  }

  const token = JSON.parse(tokenResponse.getContentText()).access_token;
  cache.put('firestore_access_token', token, 3300); // 55 minutes
  return token;
}

/**
 * Get the Firestore base path.
 * @returns {string}
 * @private
 */
function getFirestorePath_() {
  const projectId = PropertiesService.getScriptProperties().getProperty('FIRESTORE_PROJECT_ID');
  return `${FIRESTORE_BASE_URL_}/projects/${projectId}/databases/(default)/documents`;
}

// ─── CRUD Operations ───────────────────────────────────────────

/**
 * Get a single document by ID.
 * @param {string} collection — Collection name.
 * @param {string} docId — Document ID.
 * @returns {Object|null} Parsed document fields, or null if not found.
 */
function firestoreGet(collection, docId) {
  const url = `${getFirestorePath_()}/${collection}/${docId}`;
  const response = UrlFetchApp.fetch(url, {
    headers: { Authorization: 'Bearer ' + getFirestoreToken_() },
    muteHttpExceptions: true,
  });

  incrementQuota('urlFetchApp');
  incrementQuota('firestoreReads');

  const code = response.getResponseCode();
  if (code === 404) return null;
  if (code !== 200) throw new Error(`Firestore GET error ${code}: ${response.getContentText()}`);

  return parseFirestoreDoc_(JSON.parse(response.getContentText()));
}

/**
 * List documents in a collection.
 * @param {string} collection — Collection name.
 * @param {number} [pageSize=100] — Max documents to return.
 * @param {string} [pageToken] — Token for pagination.
 * @returns {{ documents: Object[], nextPageToken: string|null }}
 */
function firestoreList(collection, pageSize = 100, pageToken) {
  let url = `${getFirestorePath_()}/${collection}?pageSize=${pageSize}`;
  if (pageToken) url += `&pageToken=${encodeURIComponent(pageToken)}`;

  const response = UrlFetchApp.fetch(url, {
    headers: { Authorization: 'Bearer ' + getFirestoreToken_() },
    muteHttpExceptions: true,
  });

  incrementQuota('urlFetchApp');

  const code = response.getResponseCode();
  if (code !== 200) throw new Error(`Firestore LIST error ${code}: ${response.getContentText()}`);

  const data = JSON.parse(response.getContentText());
  const documents = (data.documents || []).map(parseFirestoreDoc_);
  incrementQuota('firestoreReads', documents.length);

  return {
    documents: documents,
    nextPageToken: data.nextPageToken || null,
  };
}

/**
 * Create or overwrite a document with a specific ID.
 * @param {string} collection — Collection name.
 * @param {string} docId — Document ID.
 * @param {Object} fields — Plain object with field values.
 * @returns {Object} Created document.
 */
function firestoreSet(collection, docId, fields) {
  const url = `${getFirestorePath_()}/${collection}?documentId=${encodeURIComponent(docId)}`;
  const body = { fields: toFirestoreFields_(fields) };

  const response = UrlFetchApp.fetch(url, {
    method: 'patch',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + getFirestoreToken_() },
    payload: JSON.stringify(body),
    muteHttpExceptions: true,
  });

  incrementQuota('urlFetchApp');
  incrementQuota('firestoreWrites');

  const code = response.getResponseCode();
  if (code !== 200) throw new Error(`Firestore SET error ${code}: ${response.getContentText()}`);

  return parseFirestoreDoc_(JSON.parse(response.getContentText()));
}

/**
 * Delete a document.
 * @param {string} collection — Collection name.
 * @param {string} docId — Document ID.
 */
function firestoreDelete(collection, docId) {
  const url = `${getFirestorePath_()}/${collection}/${docId}`;

  const response = UrlFetchApp.fetch(url, {
    method: 'delete',
    headers: { Authorization: 'Bearer ' + getFirestoreToken_() },
    muteHttpExceptions: true,
  });

  incrementQuota('urlFetchApp');
  incrementQuota('firestoreWrites'); // Deletes count against write quota

  const code = response.getResponseCode();
  if (code !== 200 && code !== 404) {
    throw new Error(`Firestore DELETE error ${code}: ${response.getContentText()}`);
  }
}

/**
 * Run a structured query on a collection.
 * @param {string} collection — Collection name.
 * @param {Object} where — Filter: { field, op, value }.
 *   op: EQUAL, NOT_EQUAL, LESS_THAN, GREATER_THAN, etc.
 * @param {number} [limit=100] — Max results.
 * @returns {Object[]} Array of parsed documents.
 */
function firestoreQuery(collection, where, limit = 100) {
  const projectId = PropertiesService.getScriptProperties().getProperty('FIRESTORE_PROJECT_ID');
  const url = `${FIRESTORE_BASE_URL_}/projects/${projectId}/databases/(default)/documents:runQuery`;

  const query = {
    structuredQuery: {
      from: [{ collectionId: collection }],
      limit: limit,
    },
  };

  if (where) {
    query.structuredQuery.where = {
      fieldFilter: {
        field: { fieldPath: where.field },
        op: where.op,
        value: toFirestoreValue_(where.value),
      },
    };
  }

  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + getFirestoreToken_() },
    payload: JSON.stringify(query),
    muteHttpExceptions: true,
  });

  incrementQuota('urlFetchApp');

  const code = response.getResponseCode();
  if (code !== 200) throw new Error(`Firestore QUERY error ${code}: ${response.getContentText()}`);

  const results = JSON.parse(response.getContentText());
  const documents = results
    .filter(r => r.document)
    .map(r => parseFirestoreDoc_(r.document));

  incrementQuota('firestoreReads', Math.max(documents.length, 1));

  return documents;
}

// ─── Firestore Value Helpers ───────────────────────────────────

/**
 * Convert Firestore document to plain object.
 * @private
 */
function parseFirestoreDoc_(doc) {
  if (!doc || !doc.fields) return null;
  const result = { _id: doc.name.split('/').pop() };
  Object.entries(doc.fields).forEach(([key, value]) => {
    result[key] = fromFirestoreValue_(value);
  });
  return result;
}

/**
 * Convert plain object to Firestore fields.
 * @private
 */
function toFirestoreFields_(obj) {
  const fields = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (key === '_id') return; // Skip internal ID
    fields[key] = toFirestoreValue_(value);
  });
  return fields;
}

/**
 * Convert a JS value to Firestore value format.
 * @private
 */
function toFirestoreValue_(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (typeof value === 'string') return { stringValue: value };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue_) } };
  }
  if (typeof value === 'object') {
    return { mapValue: { fields: toFirestoreFields_(value) } };
  }
  return { stringValue: String(value) };
}

/**
 * Convert a Firestore value to JS value.
 * @private
 */
function fromFirestoreValue_(fv) {
  if ('nullValue' in fv) return null;
  if ('booleanValue' in fv) return fv.booleanValue;
  if ('integerValue' in fv) return parseInt(fv.integerValue, 10);
  if ('doubleValue' in fv) return fv.doubleValue;
  if ('stringValue' in fv) return fv.stringValue;
  if ('timestampValue' in fv) return new Date(fv.timestampValue);
  if ('arrayValue' in fv) return (fv.arrayValue.values || []).map(fromFirestoreValue_);
  if ('mapValue' in fv) {
    const result = {};
    Object.entries(fv.mapValue.fields || {}).forEach(([k, v]) => {
      result[k] = fromFirestoreValue_(v);
    });
    return result;
  }
  return null;
}
