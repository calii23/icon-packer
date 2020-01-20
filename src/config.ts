import {existsSync, readFileSync} from 'fs';
import {parse} from 'path';

export interface ApplicationConfig {
    iconsDir: string;

    distDir: string;

    setName: string;

    iconSize: number;

    padding: number;

    appearance?: IconAppearance;

    appearanceOverride?: Record<string, IconAppearance>;

    polymerVersion: number;

    iconsFileName: string;

    enum?: CodeGenerationConfig;

    sourceRoot?: string;

    frontendRoot?: string;
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

export type IconAppearance = 'stroke' | 'fill' | 'automatic';

const configFile = process.argv[2];
if (!existsSync(configFile)) {
    console.error(`${configFile}: file not found`);
    process.exit(255);
}
export const config: ApplicationConfig = JSON.parse(readFileSync(configFile).toString());
export const configDir = parse(configFile).dir;
