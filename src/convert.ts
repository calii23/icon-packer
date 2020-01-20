// THIS FILE IS ONLY FOR TESTING 'converter.ts'

import {convert} from './converter';
import {createWriteStream, readFileSync} from 'fs';
import './utils';

let raw = readFileSync(process.argv[2]).toString();
let output = createWriteStream('converted.svg');

output.write('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">');
convert(raw, output, 4, 24, process.argv[2], 'automatic');
output.write('</svg>');
output.end();
