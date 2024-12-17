import path from 'path';
import type { OutputOptions, RollupOptions } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import esbuild from 'rollup-plugin-esbuild';
import json from '@rollup/plugin-json';
import BaseBuilder from '../common/baseBuilder';

class Tci18nVue2Builder extends BaseBuilder {
    outputOptions: OutputOptions[];

    inputOptions: RollupOptions;

    outputOptionsCDN: OutputOptions[];
    
    inputOptionsCDN: RollupOptions;

    inputPath = path.join(process.cwd(), '../packages/tci18n-vue2/index.ts');

    distPath = path.join(process.cwd(), '../packages/tci18n-vue2/dist');

    cdnPath = path.join(process.cwd(), '../packages/tci18n-vue2/cdn-dist');

    packagePath = path.join(process.cwd(), '../packages/tci18n-vue2/package.json');

    constructor() {
        super()
        this.inputOptions = {
            input: this.inputPath,
            external: [
                '@tc-i18n/intl',
                '@tc-i18n/share'
            ],
            plugins: [
                commonjs(),
                esbuild(),
                nodeResolve({
                    extensions: [".mjs", ".js", ".json", ".ts"],
                    preferBuiltins: true,
                }),
                babel({
                    extensions: ['.ts'],
                    presets: ['@babel/preset-env'],
                    // plugins: ['@babel/plugin-transform-classes'],
                }),
                json(),
            ]
        }
        this.outputOptions = [
            {
                format: 'es',
                dir: this.distPath,
                entryFileNames: `index.mjs`
            },
            {
                format: 'cjs',
                dir: this.distPath,
                entryFileNames: `index.cjs`
            },
            {
                format: 'umd',
                name: 'tci18n',
                dir: this.distPath,
            }
        ]
        this.inputOptionsCDN = {
            input: this.inputPath,
            external: [],
            plugins: [
                commonjs(),
                esbuild(),
                nodeResolve({
                    extensions: [".mjs", ".js", ".json", ".ts"],
                    preferBuiltins: true,
                }),
                babel({
                    extensions: ['.ts'],
                    presets: ['@babel/preset-env'],
                }),
                json(),
            ]
        }
        const packageJson = require(this.packagePath);
        const version = packageJson.version.split('-')[0].split('.').slice(0, 2).join('.');
        this.outputOptionsCDN = [
            {
                format: 'umd',
                name: 'tci18n',
                dir: this.cdnPath,
                entryFileNames: `tci18n-vue2@${version}.js`
            }
        ]
    }

    async build() {
        await this.rollup(this.inputOptions, this.outputOptions);
        await this.rollup(this.inputOptionsCDN, this.outputOptionsCDN);
    }
}

export default Tci18nVue2Builder;