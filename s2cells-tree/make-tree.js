module.exports = data => {
  const tree = {};
  data.forEach(base64 => {
    const chars = Array.from(base64);
    let currentNode = tree;

    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      if (!currentNode[char]) {
        currentNode[char] = {};
      }
      currentNode = currentNode[char];
    }
  });
  return tree;
};
