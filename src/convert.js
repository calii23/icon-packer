// THIS FILE SHOULD NOT BE USED TO TEST THE 'converter.js' FILE

const {readFileSync, createWriteStream} = require('fs');
const {convert} = require('./converter');

let raw = readFileSync(process.argv[2]).toString();
let output = createWriteStream('converted.svg');

Object.defineProperty(String.prototype, 'replaceAll', {
    value(search, replacement) {
        let last;
        let current = this;
        while (current !== last) {
            last = current;
            current = current.replace(search, replacement);
        }
        return current;
    }
});

output.write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">');
convert(raw, output, 4, 24, process.argv[2]);
output.write('</svg>');
output.end();
