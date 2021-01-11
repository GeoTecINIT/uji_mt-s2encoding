const { stdout } = require('process');
const fs = require('fs');
const path = require('path');

const compareArr = require('./compare-arr');

const base64Decode = {
  'A': 0,  'B': 1,  'C': 2,  'D': 3,  'E': 4,  'F': 5,  'G': 6,  'H': 7,
  'I': 8,  'J': 9,  'K': 10,  'L': 11,  'M': 12,  'N': 13,  'O': 14,  'P': 15,
  'Q': 16,	'R': 17,	'S': 18,	'T': 19,	'U': 20,	'V': 21,	'W': 22,	'X': 23,
	'Y': 24,	'Z': 25,	'a': 26,	'b': 27,	'c': 28,	'd': 29,	'e': 30,  'f': 31,
  'g': 32,  'h': 33,  'i': 34,  'j': 35,  'k': 36,  'l': 37,  'm': 38,  'n': 39,
  'o': 40,  'p': 41,  'q': 42,  'r': 43,  's': 44,  't': 45,  'u': 46,  'v': 47,
  'w': 48,  'x': 49,  'y': 50,  'z': 51,  '0': 52,  '1': 53,  '2': 54,  '3': 55,
  '4': 56,  '5': 57,  '6': 58,  '7': 59,  '8': 60,  '9': 61,  '+': 62,  '/': 63
};

const readBinary = path => fs.readFileSync(path).toString().split('\n').filter(x => x);

const readBase64 = path => fs.readFileSync(path).toString().split('\n').filter(x => x).map(base64 => {
  return Array.from(base64).map(char => base64Decode[char].toString(2).padStart(6, '0')).join('').padEnd(64, '0');
});

[9, 12, 14, 17].forEach(precision => {
  console.log(`## PRECISION ${precision} ##`);
  fs.readdirSync(`./out/binarygo-${precision}`).filter(f => path.extname(f) === '.s2cells-bin').forEach(filePath => {
    const goPath = `./out/binarygo-${precision}/${filePath}`;
    const go64Path = `./out/${precision}/${filePath.replace(/.s2cells-bin/g, '.s2cells-base64')}`
    const nodePath = `./out/binarynode-${precision}/${filePath}`;

    stdout.write(`Comparing ${filePath}...`);

    if (!fs.existsSync(nodePath)) {
      throw `${nodePath} not exists`;
    }
    if (!fs.existsSync(go64Path)) {
      throw `${go64Path} not exists`;
    }

    compareArr(readBinary(goPath), readBinary(nodePath));
    
    stdout.write('Binary OK...');
    
    compareArr(readBinary(goPath), readBase64(go64Path));
    
    console.log('Base64 OK');
  });
});

console.log('FINISHED');
