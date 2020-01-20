import {createReadStream, createWriteStream, lstatSync, readdirSync} from 'fs';
import {join} from 'path';

declare global {
    interface String {
        replaceAll(search: string | RegExp, replacement: string): string;
    }
}

Object.defineProperty(String.prototype, 'replaceAll', {
    value(this: string, search: string | RegExp, replacement: string): string {
        let last;
        let current = this;
        while (current !== last) {
            last = current;
            current = current.replace(search, replacement);
        }
        return current;
    }
});

export function toGetter(propertyName: string): string {
    return `get${propertyName.charAt(0).toUpperCase()}${propertyName.substring(1)}`;
}

export function formatDate(date): string {
    let year = date.getFullYear().toString();
    let month = (date.getMonth() + 1).toString();
    let day = date.getDate().toString();
    if (month.length === 1)
        month = '0' + month;
    if (day.length === 1)
        day = '0' + day;
    return `${year}-${month}-${day}`;
}

export function getClassName(className: string): string {
    let cut = className.lastIndexOf('.');
    if (cut !== -1) {
        return className.substring(cut + 1);
    } else {
        return className;
    }
}

export function getPackage(className: string): string {
    let cut = className.lastIndexOf('.');
    if (cut !== -1) {
        return className.substring(0, cut);
    } else {
        return className;
    }
}


export function copySync(from, to) {
    createReadStream(from).pipe(createWriteStream(to));
}

export function scanDirectorySync(directory: string, fileExtension: string): string[] {
    let result: string[] = [];
    scanDirectorySync0(directory, fileExtension, result);
    return result;
}

function scanDirectorySync0(directory: string, fileExtension: string, result: string[]): void {
    let files = readdirSync(directory);
    for (let file of files) {
        let fullPath = join(directory, file);
        if (lstatSync(fullPath).isDirectory()) {
            scanDirectorySync0(fullPath, fileExtension, result);
        } else if (file.endsWith(`.${fileExtension}`)) {
            result.push(fullPath);
        }
    }
}
