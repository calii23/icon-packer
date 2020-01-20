import * as svgpath from 'svgpath';
import {HTMLElement, NodeType, parse} from 'node-html-parser';
import {Writable} from 'stream';
import {IconAppearance} from './config';

export function convert(svg: string, output: Writable, padding: number, size: number, iconName: string, appearance: IconAppearance): void {
    try {
        let root = (parse(svg) as HTMLElement).querySelector('svg');
        if (!root) {
            console.error('file seems not to be a svg file for icon', iconName);
            return;
        }
        let originalSize = size;
        let rootViewBox = root.attributes.viewBox;
        if (rootViewBox) {
            let viewBoxParts = rootViewBox.split(' ');
            let x1 = parseFloat(viewBoxParts[0]);
            let y1 = parseFloat(viewBoxParts[1]);
            let x2 = parseFloat(viewBoxParts[2]);
            let y2 = parseFloat(viewBoxParts[3]);

            let width = x2 - x1;
            let height = y2 - y1;
            originalSize = Math.max(width, height);
        }

        if (appearance === 'automatic') {
            for (let current of root.childNodes) {
                if (current.nodeType !== NodeType.ELEMENT_NODE) {
                    continue;
                }
                let result = determineAppearance(current as HTMLElement);
                if (result) {
                    appearance = result;
                    break;
                }
            }

            if (appearance === 'automatic') {
                process.stdout.write('\x1b[2K');
                console.log(`could not determine the icon appearance for ${iconName}, use stroke as default`);
            }
        }

        output.write('<path d="');
        let path = '';
        for (let current of root.childNodes) {
            if (current.nodeType !== NodeType.ELEMENT_NODE) {
                continue;
            }
            path += convertTag(current as HTMLElement, iconName);
        }

        let parsedPath = svgpath(path);
        if ((parsedPath as any).err) {
            console.error(`could not parse path in ${iconName}: ${(parsedPath as any).err}`);
            output.write(path);
        } else {
            output.write(parsedPath
                .abs()
                .translate(padding, padding)
                .scale(size / (originalSize + padding * 2))
                .round(1)
                .toString()
                .replaceAll(' ', ','));
        }

        if (appearance === 'stroke') {
            output.write('" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>');
        } else {
            output.write('" fill="currentColor" stroke="none"/>');
        }
    } catch (e) {
        console.error('error while processing icon: ', iconName);
        console.error(e);
    }
}

function convertTag(element: HTMLElement, iconName: string): string {
    switch (element.tagName) {
        case 'path':
            return element.attributes.d;
        case 'line':
            const {x1, y1, x2, y2} = element.attributes;
            return `M${x1},${y1}L${x2},${y2}`;
        case 'polyline':
        case 'polygon':
            const {points} = element.attributes;
            let splits = points.split(' ');
            let polylinePath = '';
            for (let i = 0; i < splits.length; i += 2) {
                let x = splits[i];
                let y = splits[i + 1];
                let command = i === 0 ? 'M' : 'L';
                polylinePath += `${command}${x},${y}`;
            }
            return polylinePath;
        case 'circle':
        case 'ellipse':
            let cx = parseFloat(element.attributes.cx);
            let cy = parseFloat(element.attributes.cy);
            let rx = parseFloat(element.attributes.r ? element.attributes.r : element.attributes.rx);
            let ry = parseFloat(element.attributes.r ? element.attributes.r : element.attributes.ry);

            return `M${cx - rx},${cy}a${rx},${ry},0,1,0,${rx * 2},0a${rx},${ry},0,1,0,${-rx * 2},0`;
        case 'rect':
            if (element.attributes.rx || element.attributes.ry) {
                let {rx, ry} = element.attributes;
                let r;
                if (rx) {
                    if (ry && rx !== ry) {
                        throw new Error('Round rects with different radius are not supported!');
                    }
                    r = rx;
                } else {
                    r = ry;
                }
                let {x, y, width, height} = element.attributes;
                return convertRoundRect(parseFloat(x), parseFloat(y), parseFloat(width), parseFloat(height), parseFloat(r));
            } else {
                let {x, y, width, height} = element.attributes;
                return convertRect(parseFloat(x), parseFloat(y), parseFloat(width), parseFloat(height));
            }
        case 'g':
            let groupPath = '';
            for (let current of element.childNodes) {
                if (current.nodeType !== NodeType.ELEMENT_NODE) {
                    continue;
                }
                groupPath += convertTag(current as HTMLElement, iconName);
            }
            return groupPath;
        case 'title':
        case 'defs':
        case undefined:
            return '';
        default:
            process.stdout.write('\x1b[2K');
            console.log(`unknown tag found in ${iconName}: ${element.tagName}`);
            return '';
    }
}

function determineAppearance(element: HTMLElement): IconAppearance | null {
    switch (element.tagName) {
        case 'path':
        case 'line':
        case 'polyline':
        case 'polygon':
        case 'circle':
        case 'ellipse':
        case 'rect':
            let {fill} = element.attributes;
            if (fill && fill !== 'none') {
                return 'fill';
            }
            return 'stroke';
        case 'g':
            for (let current of element.childNodes) {
                if (current.nodeType !== NodeType.ELEMENT_NODE) {
                    continue;
                }
                let appearance = determineAppearance(current as HTMLElement);
                if (appearance) return appearance;
            }
            return null;
        default:
            return null;
    }
}

function convertRect(x: number, y: number, width: number, height: number): string {
    return `M${x},${y}l${width},0l0,${height}l${-width},0l0,${-height}`;
}

function convertRoundRect(x: number, y: number, width: number, height: number, r: number): string {
    let path = '';
    path += `M${x},${y + r}`; // initial position
    path += `q0,${-r},${r},${-r}`; // corner left top
    path += `l${width - r * 2},0`; // line top
    path += `q${r},0,${r},${r}`; // corner right top
    path += `l0,${height - r * 2}`; // line right
    path += `q0,${r},${-r},${r}`; // corner right bottom
    path += `l${-(width - r * 2)},0`; // line bottom
    path += `q${-r},0,${-r},${-r}`; // corner left bottom
    path += `l0,${-(height - r * 2)}`; // line left
    return path;
}
