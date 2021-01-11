const MARKS = require('./marks');
const base64 = require('./base64');

const travel = (output, tree) => {
  Object.keys(tree).forEach(child => {
    let value = base64.decoders[child];
    if (Object.keys(tree[child]).length > 0) {
      value |= MARKS.OPEN_MARK;
      output.push(value);
      travel(output, tree[child]);
      output.push(MARKS.CLOSE_MARK);
    } else {
      output.push(value);
    }
  });
};

module.exports.interpret = data => {
  let result = '';
  data.forEach(byte => {
    if (byte === MARKS.CLOSE_MARK) {
      result += ']';
    } else {
      const open = (byte & MARKS.OPEN_MARK) ? true : false;
      const realValue = byte & MARKS.DATA_MARK;
      result += base64.encoders[realValue];
      if (open) {
        result += '[';
      }
    }
  });
  return result;
};

module.exports.encode = tree => {
  const output = [];
  travel(output, tree);
  return output;
};
