module.exports = (arr1, arr2, orderStrict = true) => {
  if (arr1.length !== arr2.length) {
    throw `Length is not equal (${arr1.length} != ${arr2.length})`;
  }
  if (orderStrict) {
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] != arr2[i]) {
        throw `Line #${i + 1} is not equal (${arr1[i]} != ${arr2[i]})`;
      }
    }
  } else {
    arr2 = arr2.map(a => a);
    arr1.forEach(a1 => {
      const a2idx = arr2.findIndex(a2 => a1 === a2);
      if (a2idx === -1) {
        throw `${a1} in array 1 is not found in array 2`;
      }
    });
  }
};
