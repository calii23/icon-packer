const {parse} = require('node-html-parser');
const svgpath = require('svgpath');

module.exports.convert = (svg, output, padding, size, iconName) => {
    let root = parse(svg);
    let originalSize = size;
    let rootViewBox = root.firstChild.attributes.viewBox;
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
    output.write('<path d="');
    let path = '';
    for (let current of root.firstChild.childNodes) {
        path += convertTag(current, padding);
    }

    let parsedPath = svgpath(path);
    if (parsedPath.err) {
        console.error(`could not parse path in ${iconName}: ${parsedPath.err}`);
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

    output.write('" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>');

};

function convertTag(element, iconName) {
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
            let {cx, cy, rx, ry, r} = element.attributes;
            if (r) {
                rx = r;
                ry = r;
            }
            cx = parseFloat(cx);
            cy = parseFloat(cy);
            rx = parseFloat(rx);
            ry = parseFloat(ry);

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
                groupPath += convertTag(current, iconName);
            }
            return groupPath;
        case 'title':
        case 'defs':
        case undefined:
            return '';
        default:
            process.stdout.write('\033[2K');
            console.log(`unknown tag found in ${iconName}: ${element.tagName}`);
            return '';
    }
}

function convertRect(x, y, width, height) {
    return `M${x},${y}l${width},0l0,${height}l${-width},0l0,${-height}`;
}

function convertRoundRect(x, y, width, height, r) {
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
