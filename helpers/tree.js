const buildTree = (arr) => {
  const map = {};
  const tree = [];
  let count = 0;

  // tạo map
  arr.forEach((item) => {
    const id = String(item._id || item.id);
    map[id] = {
      ...item,
      children: [],
    };
  });

  // build tree
  arr.forEach((item) => {
    const id = String(item._id || item.id);
    const parentId = item.parent_id ? String(item.parent_id) : null;

    count++;
    map[id].index = count;

    if (!parentId) {
      tree.push(map[id]);
    } else if (map[parentId]) {
      map[parentId].children.push(map[id]);
    }
  });

  return tree;
};

module.exports.tree = buildTree;