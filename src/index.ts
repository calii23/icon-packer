#!/usr/bin/env node
import {createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync} from 'fs';
import {join, parse} from 'path';
import * as mkdirs from 'mkdirs';
import {Writable} from 'stream';

import {CodeGenerator, JavaCodeGenerator, KotlinCodeGenerator} from './code-generator';
import {config, configDir} from './config';
import {copySync, scanDirectorySync} from './utils';
import {MemoryWriteStream} from './memory-stream';
import {convert} from './converter';

if (process.argv.length !== 3) {
    console.error(`Usage: node ${__filename} [config_file]`);
    process.exit(-1);
}

class Application {
    private codeGenerator: CodeGenerator | undefined;
    private iconSetStream: Writable;

    private iconsDir: string;
    private distDir: string;

    private icons: string[];

    public run(): void {
        this.init();
        this.scanIcons();
        this.startCodeGeneration();
        this.convertIcons();
        this.endCodeGeneration();
        this.packIcons();
        this.copyToTarget();
    }

    private startCodeGeneration(): void {
        if (config.enum) this.codeGenerator.start(config.enum, this.distDir);
        this.iconSetStream.write(`<iron-iconset-svg name="${config.setName}" size="${config.iconSize}"><svg><defs>`);
    }

    private endCodeGeneration(): void {
        if (config.enum) this.codeGenerator.end(config.enum, config.setName);
        this.iconSetStream.write('</defs></svg></iron-iconset-svg>');
        this.iconSetStream.end();
    }

    private packIcons(): void {
        if (config.polymerVersion === 3) {
            let icons = (this.iconSetStream as MemoryWriteStream).toBuffer().toString();
            writeFileSync(join(this.distDir, config.iconsFileName), `import '@polymer/iron-iconset-svg/iron-iconset-svg.js';var e=document.createElement("template");e.innerHTML=${JSON.stringify(icons)};document.head.appendChild(e.content);`);
        }
    }

    private copyToTarget(): void {
        if (config.enum && config.sourceRoot) {
            this.codeGenerator.copyToSources(this.distDir, config.sourceRoot, config.enum.package, config.enum.className);
        }
        if (config.frontendRoot) {
            let iconsDestinationDir = join(configDir, config.frontendRoot);
            mkdirs(iconsDestinationDir);
            copySync(join(this.distDir, config.iconsFileName), join(iconsDestinationDir, config.iconsFileName));
        }
    }

    private scanIcons(): void {
        this.icons = scanDirectorySync(join(configDir, config.iconsDir), 'svg');
        //this.icons = readdirSync(join(configDir, config.iconsDir))
        //    .filter(fullName => fullName.toLowerCase().endsWith('.svg'));
        console.log(`found ${this.icons.length} icons`);
    }

    private convertIcons(): void {
        let start = new Date().getTime();

        for (let i = 0; i < this.icons.length; i++) {
            let iconFile = this.icons[i];
            let icon = parse(iconFile).name;
            process.stdout.write('\x1b[2Kprocessing icon (' + (i + 1) + '/' + this.icons.length + '): ' + icon + '\r');
            if (config.enum) this.codeGenerator.writeIcon(icon, i === this.icons.length - 1);
            let rawIconData = readFileSync(iconFile).toString();
            this.iconSetStream.write(`<g id="${icon}">`);
            convert(rawIconData, this.iconSetStream, config.padding, config.iconSize, icon, (config.appearanceOverride || {})[icon] || config.appearance || 'automatic');
            this.iconSetStream.write('</g>');
        }

        let time = new Date().getTime() - start;
        console.log(`processed ${this.icons.length} icons in ${time}ms (${(time / this.icons.length).toFixed(3)}ms per icon)`);
    }

    private init(): void {
        this.initPaths();
        this.initIconSetStream();
        this.initCodeGenerator();
    }

    private initPaths(): void {
        this.iconsDir = join(configDir, config.iconsDir);
        this.distDir = join(configDir, config.distDir);
        if (!existsSync(this.distDir)) mkdirSync(this.distDir);
    }

    private initIconSetStream(): void {
        if (config.polymerVersion === 2) {
            this.iconSetStream = createWriteStream(join(this.distDir, config.iconsFileName));
        } else if (config.polymerVersion === 3) {
            this.iconSetStream = new MemoryWriteStream();
        } else {
            console.error('Unsupported Polymer version:', config.polymerVersion);
            process.exit(2);
        }
    }

    private initCodeGenerator(): void {
        if (!config.enum) return;
        switch (config.enum.language) {
            case 'java':
                this.codeGenerator = new JavaCodeGenerator();
                break;
            case 'kotlin':
                this.codeGenerator = new KotlinCodeGenerator();
                break;
            default:
                console.error('Unsupported language:', config.enum.language);
                process.exit(2);
        }
    }
}

new Application().run();
