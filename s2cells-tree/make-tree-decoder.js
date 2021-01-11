const MARKS = require('./marks');
const base64 = require('./base64');

module.exports.decode = data => {
  const tree = {};
  let currentNode = tree;
  const stack = [];
  data.forEach(byte => {
    if (byte === MARKS.CLOSE_MARK) {
      currentNode = stack.pop();
    } else {
      const open = byte & MARKS.OPEN_MARK ? true : false;
      const realValue = byte & MARKS.DATA_MARK;
      const char = base64.encoders[realValue];
      if (!currentNode[char]) {
        currentNode[char] = {};
      }
      if (open) {
        stack.push(currentNode);
        currentNode = currentNode[char];
      }
    }
  });
  return tree;
};
