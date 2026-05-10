function buildLevelResolver(categoryMap) {
  const cache = {};

  function resolve(category) {
    const id = category._id.toString();
    if (cache[id]) return cache[id];

    if (!category.parent_id) {
      cache[id] = 1;
      return 1;
    }

    const parent = categoryMap[category.parent_id.toString()];
    if (!parent) {
      cache[id] = 1;
      return 1;
    }

    const level = resolve(parent) + 1;
    cache[id] = level;
    return level;
  }

  return resolve;
}

module.exports = {
  buildLevelResolver,
};