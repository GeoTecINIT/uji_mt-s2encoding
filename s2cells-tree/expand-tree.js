const travel = (tree, current, arr) => {
  const keys = Object.keys(tree);
  if (keys.length) {
    keys.forEach(char => {
      travel(tree[char], current + char, arr);
    });
  } else {
    arr.push(current);
  }
};

module.exports = tree => {
  const results = [];
  travel(tree, '', results);
  return results;
};
