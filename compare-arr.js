module.exports = (arr1, arr2) => {
  if (arr1.length !== arr2.length) {
    throw `Length is not equal (${arr1.length} != ${arr2.length})`;
  }
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      throw `Line #${i + 1} is not equal (${arr1[i]} != ${arr2[i]})`;
    }
  }
};
