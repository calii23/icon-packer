import {existsSync, readFileSync} from 'fs';
import {parse} from 'path';

export interface ApplicationConfig {
    iconsDir: string;

    distDir: string;

    setName: string;

    iconSize: number;

    padding: number;

    iconsFileName: string;

    enum: CodeGenerationConfig;

    targetProjectRoot?: string;
}

export interface CodeGenerationConfig {
    className: string;

    package: string;

    interfaces?: string[];

    iconSetNameProperty?: CodeComponent;

    iconNameProperty: CodeComponent;

    createFunction?: CodeComponent;

    language: 'java' | 'kotlin';
}

export interface CodeComponent {
    name: string;

    override: boolean;
}


const configFile = process.argv[2];
if (!existsSync(configFile)) {
    console.error(`${configFile}: file not found`);
    process.exit(255);
}
export const config: ApplicationConfig = JSON.parse(readFileSync(configFile).toString());
export const configDir = parse(configFile).dir;
