import path from 'path';
import type { OutputOptions, RollupOptions } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import esbuild from 'rollup-plugin-esbuild';
import babel from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';
import BaseBuilder from '../common/baseBuilder';

class Tci18nVue3Builder extends BaseBuilder {
    outputOptions: OutputOptions[];

    inputOptions: RollupOptions;

    outputOptionsCDN: OutputOptions[];
    
    inputOptionsCDN: RollupOptions;

    inputPath = path.join(process.cwd(), '../packages/tci18n-intl/index.ts');

    distPath = path.join(process.cwd(), '../packages/tci18n-intl/dist');

    cdnPath = path.join(process.cwd(), '../packages/tci18n-intl/cdn-dist');

    packageJSON = path.join(process.cwd(), '../packages/tci18n-intl/package.json');

    constructor() {
        super()
        this.inputOptions = {
            input: this.inputPath,
            external: [
                '@tc-i18n/share'
            ],
            plugins: [
                esbuild(),
                commonjs(),
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
                dir: this.distPath
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
                    // plugins: ['@babel/plugin-transform-classes'],
                }),
                json(),
            ]
        }
        const packageJson = require(this.packageJSON)
        this.outputOptionsCDN = [
            {
                format: 'umd',
                name: 'tci18n',
                dir: this.cdnPath,
                entryFileNames: `tci18n-intl@${packageJson.version.replace(/\./g, '.')}.js`
            }
        ]
    }

    async build() {
        await this.rollup(this.inputOptions, this.outputOptions);
        await this.rollup(this.inputOptionsCDN, this.outputOptionsCDN);
    }
}

export default Tci18nVue3Builder;