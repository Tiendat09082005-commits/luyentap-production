const mongoose = require('mongoose');
const cacheService = require('../services/cache.service');

class SearchHelper {
  static normalizeKeyword(keyword) {
    return String(keyword || '').trim().toLowerCase();
  }

  static escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  static isValidCursor(after) {
    return !after || mongoose.Types.ObjectId.isValid(after);
  }

  static buildPrefixQuery(fields, keyword) {
    const escapedKeyword = SearchHelper.escapeRegex(keyword);

    return {
      $or: fields.map((field) => ({
        [field]: { $regex: `^${escapedKeyword}`, $options: 'i' }
      }))
    };
  }

  static async runQuery({
    model,
    query,
    projection,
    limit
  }) {
    return model
      .find(query)
      .select(projection)
      .sort({ _id: -1 })
      .limit(limit)
      .lean();
  }

  static async search({
    model,
    keyword = '',
    searchFields = ['title'],
    projection = '',
    limit = 20,
    filter = {},
    after = null,
    useTextIndex = false,
    minKeywordLength = 1,
    ttl = 300
  }) {
    const term = SearchHelper.normalizeKeyword(keyword);
    const sanitizedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    if (!term || term.length < minKeywordLength) {
      return { items: [], nextCursor: null };
    }

    const cursorId = after && SearchHelper.isValidCursor(after)
      ? new mongoose.Types.ObjectId(after)
      : null;

    const cacheKey = cacheService.constructor.buildKey(
      `search:${model.modelName}`,
      {
        keyword: term,
        searchFields,
        projection,
        limit: sanitizedLimit,
        filter,
        after: cursorId ? cursorId.toString() : null,
        useTextIndex
      }
    );

    return cacheService.getOrSet(cacheKey, async () => {
      const baseQuery = { ...filter };

      if (cursorId) {
        baseQuery._id = { $lt: cursorId };
      }

      let items = [];

      if (useTextIndex) {
        items = await SearchHelper.runQuery({
          model,
          query: { ...baseQuery, $text: { $search: term } },
          projection,
          limit: sanitizedLimit
        });
      }

      if (items.length === 0) {
        items = await SearchHelper.runQuery({
          model,
          query: { ...baseQuery, ...SearchHelper.buildPrefixQuery(searchFields, term) },
          projection,
          limit: sanitizedLimit
        });
      }

      const nextCursor =
        items.length === sanitizedLimit ? String(items[items.length - 1]._id) : null;

      return { items, nextCursor };
    }, ttl);
  }

  static async suggest({
    model,
    keyword = '',
    suggestFields = ['title'],
    projection = 'title slug',
    filter = {},
    limit = 5,
    minKeywordLength = 1,
    ttl = 120
  }) {
    const term = SearchHelper.normalizeKeyword(keyword);
    const sanitizedLimit = Math.min(Math.max(parseInt(limit, 10) || 5, 1), 20);

    if (!term || term.length < minKeywordLength) {
      return [];
    }

    const cacheKey = cacheService.constructor.buildKey(
      `sugg:${model.modelName}`,
      {
        keyword: term,
        suggestFields,
        projection,
        filter,
        limit: sanitizedLimit
      }
    );

    return cacheService.getOrSet(cacheKey, async () => {
      return SearchHelper.runQuery({
        model,
        query: { ...filter, ...SearchHelper.buildPrefixQuery(suggestFields, term) },
        projection,
        limit: sanitizedLimit
      });
    }, ttl);
  }

  static safeHighlight(text, keyword, className = 'hl') {
    if (!text || !keyword) {
      return text;
    }

    const escapedText = String(text).replace(/[&<>"']/g, (match) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      '\'': '&#039;'
    }[match]));

    const escapedKeyword = SearchHelper.escapeRegex(keyword);
    const regex = new RegExp(`(${escapedKeyword})`, 'gi');
    return escapedText.replace(regex, `<mark class="${className}">$1</mark>`);
  }
}

module.exports = { SearchHelper };
