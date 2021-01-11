const fs = require('fs');
const path = require('path');
const { stdout } = require('process');

const makeTree = require('./s2cells-tree/make-tree');
const expandTree = require('./s2cells-tree/expand-tree');
const encoder = require('./s2cells-tree/make-tree-encoder');
const decoder = require('./s2cells-tree/make-tree-decoder');
const compareArr = require('./compare-arr');

const statsPath = './out/stats-b64tree.csv';
fs.writeFileSync(statsPath, 'PRECISION,S2B64TREE_KB,S2B64TREE_TIME_SEC\n');

[9, 12, 14, 17].forEach(precision => {
  console.log(`## PRECISION ${precision} ##`);
  let sumSizeBytes = 0;
  let sumTimeMillisecs = 0;

  const filePaths = fs.readdirSync(`./out/${precision}`)
    .map(f => `./out/${precision}/${f}`)
    .filter(f => path.extname(f) === '.s2cells-base64');
  filePaths.forEach(filePath => {
    stdout.write(`Checking ${path.basename(filePath)}...`);
    const data = fs.readFileSync(filePath).toString().split('\n').filter(x => x);
    const startTime = new Date().getTime();
    const tree = makeTree(data);
    const encodedTree = encoder.encode(tree);
    fs.writeFileSync(filePath + 'tree', Buffer.from(encodedTree));
    sumTimeMillisecs += new Date().getTime() - startTime;
    sumSizeBytes += Buffer.from(encodedTree).byteLength;
    const decodedTree = decoder.decode(encodedTree);
    const expandedTree = expandTree(decodedTree);
    compareArr(data, expandedTree, false);
    console.log('OK');
  });

  fs.appendFileSync(statsPath, `${precision},${sumSizeBytes / 1024},${sumTimeMillisecs / 1000}\n`);
});

console.log('FINISHED');
