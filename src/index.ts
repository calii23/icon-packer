#!/usr/bin/env node
import {CodeGenerator, JavaCodeGenerator, KotlinCodeGenerator} from './code-generator';
import {createWriteStream, readdirSync, readFileSync, WriteStream} from 'fs';
import {join, parse} from 'path';
import {convert} from './converter';
import * as mkdirs from 'mkdirs';

import {config, configDir} from './config';
import {copySync} from './utils';

if (process.argv.length !== 3) {
    console.error(`Usage: node ${__filename} [config_file]`);
    process.exit(-1);
}

class Application {
    private codeGenerator: CodeGenerator;
    private iconSetStream: WriteStream;

    private iconsDir: string;
    private distDir: string;
    private targetProjectRoot: string | null;

    private icons: string[];

    public run(): void {
        this.init();
        this.scanIcons();
        this.startCodeGeneration();
        this.convertIcons();
        this.endCodeGeneration();
        if (this.targetProjectRoot) {
            this.copyToTarget();
        }
    }

    private startCodeGeneration(): void {
        this.codeGenerator.start(config.enum, this.distDir);
        this.iconSetStream.write(`<iron-iconset-svg name="${config.setName}" size="${config.iconSize}"><svg><defs>`);
    }

    private endCodeGeneration(): void {
        this.codeGenerator.end(config.enum, config.setName);
        this.iconSetStream.write('</defs></svg></iron-iconset-svg>');
        this.iconSetStream.end();
    }

    private copyToTarget(): void {
        this.codeGenerator.copyToSources(this.distDir, this.targetProjectRoot, config.enum.package, config.enum.className);
        let iconsDestinationDir = join(configDir, config.targetProjectRoot, 'src', 'main', 'resources', 'static', 'frontend');
        mkdirs(iconsDestinationDir);
        copySync(join(this.distDir, config.iconsFileName), join(iconsDestinationDir, config.iconsFileName));
    }

    private scanIcons(): void {
        this.icons = readdirSync(join(configDir, config.iconsDir))
            .filter(fullName => fullName.toLowerCase().endsWith('.svg'));
        console.log(`found ${this.icons.length} icons`);
    }

    private convertIcons(): void {
        let start = new Date().getTime();

        for (let i = 0; i < this.icons.length; i++) {
            let iconFile = this.icons[i];
            let icon = parse(iconFile).name;
            process.stdout.write('\x1b[2Kprocessing icon (' + (i + 1) + '/' + this.icons.length + '): ' + icon + '\r');
            this.codeGenerator.writeIcon(icon, i === this.icons.length - 1);
            let rawIconData = readFileSync(join(this.iconsDir, iconFile)).toString();
            this.iconSetStream.write(`<g id="${icon}">`);
            convert(rawIconData, this.iconSetStream, config.padding, config.iconSize, icon);
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
        if (config.targetProjectRoot) {
            this.targetProjectRoot = join(configDir, config.targetProjectRoot);
        } else {
            this.targetProjectRoot = null;
        }
    }

    private initIconSetStream(): void {
        this.iconSetStream = createWriteStream(join(this.distDir, config.iconsFileName));
    }

    private initCodeGenerator(): void {
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
