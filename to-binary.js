const { stdout } = require('process');
const fs = require('fs');
const path = require('path');

const filePaths = fs.readdirSync('./out')
  .filter(d => fs.lstatSync(`./out/${d}`).isDirectory() && !d.startsWith('binary'))
  .map(d => `./out/${d}`)
  .reduce((arr, d) => {
    arr.push(...fs.readdirSync(d).filter(p => path.extname(p) === '.s2cells').map(f => `${d}/${f}`));
    return arr;
  }, []);

const getNewPath = filePath => {
  const paths = path.dirname(filePath).split('/');
  paths[paths.length - 1] = `binarynode-${paths[paths.length - 1]}`;
  const newDir = paths.join('/');
  if (!fs.existsSync(newDir)) {
    fs.mkdirSync(newDir);
  }
  return `${newDir}/${path.basename(filePath)}-bin`;
};

const getBinaries = filePath => fs.readFileSync(filePath)
  .toString()
  .split('\n')
  .filter(x => x !== '')
  .map(token => {
    return Array.from(token)
      .map(t => parseInt(t, 16).toString(2).padStart(4, '0'))
      .join('')
      .padEnd(64, '0');
  }).join('\n');

filePaths.forEach(async(filePath) => {
  stdout.write(`Reading ${filePath}...`);
  try {
    fs.writeFileSync(getNewPath(filePath), getBinaries(filePath));
    console.log('OK');
  } catch (err) {
    console.log(`ERROR: ${err}`);
  }
});
console.log('FINISHED');
