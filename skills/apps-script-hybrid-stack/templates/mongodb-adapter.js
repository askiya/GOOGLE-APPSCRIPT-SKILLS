/**
 * MongoDB Atlas Data API Adapter for Google Apps Script
 * Pattern F — GAS + MongoDB Atlas (M0 Free Cluster)
 *
 * Prerequisites:
 * 1. Create an M0 free cluster at https://cloud.mongodb.com
 * 2. Enable the Data API in Atlas dashboard (App Services > Data API).
 * 3. Create an API key for the Data API.
 * 4. Store in Script Properties:
 *    - MONGODB_DATA_API_URL: https://data.mongodb-api.com/app/data-xxxxx/endpoint/data/v1
 *    - MONGODB_API_KEY: your Data API key
 *    - MONGODB_DATA_SOURCE: your cluster name (e.g., 'Cluster0')
 *    - MONGODB_DATABASE: your database name
 */

// ─── Configuration ─────────────────────────────────────────────

/**
 * Get MongoDB config from Script Properties.
 * @returns {{ url: string, apiKey: string, dataSource: string, database: string }}
 * @private
 */
function getMongoConfig_() {
  const props = PropertiesService.getScriptProperties();
  return {
    url: props.getProperty('MONGODB_DATA_API_URL'),
    apiKey: props.getProperty('MONGODB_API_KEY'),
    dataSource: props.getProperty('MONGODB_DATA_SOURCE'),
    database: props.getProperty('MONGODB_DATABASE'),
  };
}

/**
 * Call MongoDB Data API.
 * @param {string} action — API action (findOne, find, insertOne, etc.).
 * @param {Object} body — Request body.
 * @returns {Object} Response data.
 * @private
 */
function mongoFetch_(action, body) {
  const config = getMongoConfig_();
  const url = `${config.url}/action/${action}`;

  const payload = {
    dataSource: config.dataSource,
    database: config.database,
    ...body,
  };

  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'api-key': config.apiKey,
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  incrementQuota('urlFetchApp');

  const code = response.getResponseCode();
  if (code !== 200 && code !== 201) {
    throw new Error(`MongoDB error ${code}: ${response.getContentText()}`);
  }

  return JSON.parse(response.getContentText());
}

// ─── CRUD Operations ───────────────────────────────────────────

/**
 * Find a single document.
 * @param {string} collection — Collection name.
 * @param {Object} filter — MongoDB query filter.
 * @param {Object} [projection] — Fields to include/exclude.
 * @returns {Object|null} Document or null.
 */
function mongoFindOne(collection, filter, projection) {
  const body = { collection, filter };
  if (projection) body.projection = projection;

  const result = mongoFetch_('findOne', body);
  return result.document || null;
}

/**
 * Find multiple documents.
 * @param {string} collection
 * @param {Object} [filter={}] — MongoDB query filter.
 * @param {Object} [options]
 * @param {Object} [options.projection] — Fields to include/exclude.
 * @param {Object} [options.sort] — Sort order, e.g., { createdAt: -1 }.
 * @param {number} [options.limit] — Max documents.
 * @param {number} [options.skip] — Documents to skip.
 * @returns {Object[]} Array of documents.
 */
function mongoFind(collection, filter = {}, options = {}) {
  const body = { collection, filter };
  if (options.projection) body.projection = options.projection;
  if (options.sort) body.sort = options.sort;
  if (options.limit) body.limit = options.limit;
  if (options.skip) body.skip = options.skip;

  const result = mongoFetch_('find', body);
  return result.documents || [];
}

/**
 * Insert a single document.
 * @param {string} collection
 * @param {Object} document — Document to insert.
 * @returns {string} Inserted document ID.
 */
function mongoInsertOne(collection, document) {
  const result = mongoFetch_('insertOne', { collection, document });
  return result.insertedId;
}

/**
 * Insert multiple documents.
 * @param {string} collection
 * @param {Object[]} documents
 * @returns {string[]} Inserted document IDs.
 */
function mongoInsertMany(collection, documents) {
  const result = mongoFetch_('insertMany', { collection, documents });
  return result.insertedIds;
}

/**
 * Update a single document.
 * @param {string} collection
 * @param {Object} filter — Query to match.
 * @param {Object} update — Update operations (use $set, $inc, etc.).
 * @param {boolean} [upsert=false] — Insert if not found.
 * @returns {{ matchedCount: number, modifiedCount: number }}
 */
function mongoUpdateOne(collection, filter, update, upsert = false) {
  const result = mongoFetch_('updateOne', { collection, filter, update, upsert });
  return {
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
    upsertedId: result.upsertedId,
  };
}

/**
 * Update multiple documents.
 * @param {string} collection
 * @param {Object} filter
 * @param {Object} update
 * @returns {{ matchedCount: number, modifiedCount: number }}
 */
function mongoUpdateMany(collection, filter, update) {
  const result = mongoFetch_('updateMany', { collection, filter, update });
  return {
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
  };
}

/**
 * Replace a document entirely.
 * @param {string} collection
 * @param {Object} filter
 * @param {Object} replacement — Complete replacement document.
 * @param {boolean} [upsert=false]
 * @returns {{ matchedCount: number, modifiedCount: number }}
 */
function mongoReplaceOne(collection, filter, replacement, upsert = false) {
  return mongoFetch_('replaceOne', { collection, filter, replacement, upsert });
}

/**
 * Delete a single document.
 * @param {string} collection
 * @param {Object} filter
 * @returns {{ deletedCount: number }}
 */
function mongoDeleteOne(collection, filter) {
  const result = mongoFetch_('deleteOne', { collection, filter });
  return { deletedCount: result.deletedCount };
}

/**
 * Delete multiple documents.
 * @param {string} collection
 * @param {Object} filter
 * @returns {{ deletedCount: number }}
 */
function mongoDeleteMany(collection, filter) {
  const result = mongoFetch_('deleteMany', { collection, filter });
  return { deletedCount: result.deletedCount };
}

/**
 * Run an aggregation pipeline.
 * @param {string} collection
 * @param {Object[]} pipeline — Aggregation stages.
 * @returns {Object[]} Aggregation results.
 */
function mongoAggregate(collection, pipeline) {
  const result = mongoFetch_('aggregate', { collection, pipeline });
  return result.documents || [];
}

// ─── Backup Helper ─────────────────────────────────────────────

/**
 * Export a collection to Google Drive as JSON backup.
 * @param {string} collection
 * @param {string} folderId — Google Drive folder ID.
 */
function mongoBackupCollection(collection, folderId) {
  const documents = mongoFind(collection, {}, { limit: 10000 });
  const json = JSON.stringify(documents, null, 2);
  const fileName = `backup_mongo_${collection}_${new Date().toISOString().split('T')[0]}.json`;

  const folder = DriveApp.getFolderById(folderId);
  folder.createFile(fileName, json, MimeType.PLAIN_TEXT);
  Logger.log(`Backed up ${documents.length} documents from ${collection} to ${fileName}`);
}
