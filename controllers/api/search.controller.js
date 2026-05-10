const mongoose = require('mongoose');
const { SearchHelper } = require('../../helpers/searchHelper');
const rateLimiter = require('../../services/rateLimiter.service');
const searchConfigs = require('../../config/search.config');
const ProductCategory = require('../../models/products-category.model');
const Brand = require('../../models/brand.model');

const BRAND_ALIASES = {
  apple: ['iphone', 'ios']
};

const normalizeTerm = (value) => String(value || '').trim().toLowerCase();

const sanitizeFilters = (query, allowedFilters = {}) => {
  const sanitizedFilters = {};

  for (const [field, rule] of Object.entries(allowedFilters)) {
    const rawValue = query[field];

    if (rawValue === undefined || rawValue === null || rawValue === '' || rawValue === 'undefined') {
      continue;
    }

    if (rule.type === 'objectId') {
      if (!mongoose.Types.ObjectId.isValid(rawValue)) {
        throw new Error(`Invalid filter: ${field}`);
      }

      sanitizedFilters[field] = rawValue;
      continue;
    }

    if (rule.type === 'enum') {
      if (!rule.values.includes(rawValue)) {
        throw new Error(`Invalid filter: ${field}`);
      }

      sanitizedFilters[field] = rawValue;
      continue;
    }

    if (rule.type === 'number') {
      const parsedValue = Number(rawValue);

      if (!Number.isFinite(parsedValue)) {
        throw new Error(`Invalid filter: ${field}`);
      }

      sanitizedFilters[field] = parsedValue;
      continue;
    }

    sanitizedFilters[field] = String(rawValue).trim();
  }

  return sanitizedFilters;
};

const isSearchRequestRateLimited = async (req, entity, action) => {
  const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
  return rateLimiter.isRateLimited(`search:${entity}:${action}:${ipAddress}`, 30, 10);
};

const resolveProductCategoryFilter = async (categorySlug) => {
  const normalizedSlug = String(categorySlug || '').trim();
  if (!normalizedSlug) return {};

  const [allCategories, brands] = await Promise.all([
    ProductCategory.find({
      deleted: false,
      status: 'active'
    }).select('_id title slug parent_id').lean(),
    Brand.find({
      deleted: false,
      status: 'active'
    }).select('_id title slug').lean()
  ]);

  const selectedCategory = allCategories.find((cat) => cat.slug === normalizedSlug);
  if (selectedCategory) {
    const childrenByParent = new Map();
    const selectedTerms = new Set([
      normalizeTerm(selectedCategory.slug),
      normalizeTerm(selectedCategory.title)
    ]);

    allCategories.forEach((cat) => {
      if (!cat.parent_id) return;
      const parentId = String(cat.parent_id);
      if (!childrenByParent.has(parentId)) {
        childrenByParent.set(parentId, []);
      }
      childrenByParent.get(parentId).push(cat);
    });

    const selectedIds = new Set([String(selectedCategory._id)]);
    const queue = [String(selectedCategory._id)];

    while (queue.length) {
      const currentId = queue.shift();
      const children = childrenByParent.get(currentId) || [];

      children.forEach((child) => {
        const childId = String(child._id);
        selectedTerms.add(normalizeTerm(child.slug));
        selectedTerms.add(normalizeTerm(child.title));
        if (selectedIds.has(childId)) return;
        selectedIds.add(childId);
        queue.push(childId);
      });
    }

    const matchedBrandIds = brands
      .filter((brand) => {
        const brandSlug = normalizeTerm(brand.slug);
        const brandTitle = normalizeTerm(brand.title);
        const aliases = BRAND_ALIASES[brandSlug] || [];

        return (
          selectedTerms.has(brandSlug) ||
          selectedTerms.has(brandTitle) ||
          aliases.some((alias) => selectedTerms.has(alias))
        );
      })
      .map((brand) => brand._id);

    const filters = [{ category_id: { $in: Array.from(selectedIds) } }];
    if (matchedBrandIds.length) {
      filters.push({ brand_id: { $in: matchedBrandIds } });
    }

    return filters.length === 1 ? filters[0] : { $or: filters };
  }

  const selectedBrand = await Brand.findOne({
    slug: normalizedSlug,
    deleted: false,
    status: 'active'
  }).select('_id').lean();

  if (selectedBrand) {
    return { brand_id: selectedBrand._id };
  }

  return { _id: null };
};

const createSearchHandler = (entity) => {
  const config = searchConfigs[entity];

  return async (req, res) => {
    try {
      const { keyword = '', limit, after } = req.query;

      if (after && !SearchHelper.isValidCursor(after)) {
        return res.status(400).json({ success: false, message: 'Invalid cursor' });
      }

      if (await isSearchRequestRateLimited(req, entity, 'search')) {
        return res.status(429).json({ success: false, message: 'Too many search requests' });
      }

      const filters = sanitizeFilters(req.query, config.allowedFilters);
      const productCategoryFilter =
        entity === 'products' && req.query.category
          ? await resolveProductCategoryFilter(req.query.category)
          : {};

      const result = await SearchHelper.search({
        model: config.model,
        keyword,
        searchFields: config.searchFields,
        projection: config.searchProjection,
        limit,
        after,
        filter: { ...config.defaultFilter, ...filters, ...productCategoryFilter },
        useTextIndex: config.useTextIndex,
        minKeywordLength: config.minKeywordLength
      });

      return res.json({
        success: true,
        data: result.items,
        nextCursor: result.nextCursor,
        meta: { hasMore: Boolean(result.nextCursor) }
      });
    } catch (error) {
      const isValidationError = /^Invalid filter:/.test(error.message);
      const statusCode = isValidationError ? 400 : 503;

      console.error(`Search API Error [${entity}]:`, error.message);
      return res.status(statusCode).json({
        success: false,
        message: isValidationError ? error.message : 'Search service unavailable'
      });
    }
  };
};

const createSuggestHandler = (entity) => {
  const config = searchConfigs[entity];

  return async (req, res) => {
    try {
      if (await isSearchRequestRateLimited(req, entity, 'suggest')) {
        return res.status(429).json({ success: false, message: 'Too many suggestion requests' });
      }

      const filters = sanitizeFilters(req.query, config.allowedFilters);
      const productCategoryFilter =
        entity === 'products' && req.query.category
          ? await resolveProductCategoryFilter(req.query.category)
          : {};

      const results = await SearchHelper.suggest({
        model: config.model,
        keyword: req.query.keyword,
        suggestFields: config.suggestFields,
        projection: config.suggestProjection,
        filter: { ...config.defaultFilter, ...filters, ...productCategoryFilter },
        limit: req.query.limit || 8,
        minKeywordLength: config.minKeywordLength
      });

      return res.json({ success: true, data: results });
    } catch (error) {
      const isValidationError = /^Invalid filter:/.test(error.message);
      const statusCode = isValidationError ? 400 : 503;

      console.error(`Suggest API Error [${entity}]:`, error.message);
      return res.status(statusCode).json({
        success: false,
        message: isValidationError ? error.message : 'Suggestion service unavailable'
      });
    }
  };
};

module.exports = {
  searchProducts: createSearchHandler('products'),
  suggestProducts: createSuggestHandler('products'),
  searchUsers: createSearchHandler('users'),
  suggestUsers: createSuggestHandler('users'),
  searchAccounts: createSearchHandler('accounts'),
  suggestAccounts: createSuggestHandler('accounts'),
  searchOrders: createSearchHandler('orders'),
  suggestOrders: createSuggestHandler('orders')
};
