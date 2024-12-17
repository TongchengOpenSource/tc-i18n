import path from 'path';
import type { OutputOptions, RollupOptions } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import esbuild from 'rollup-plugin-esbuild';
import json from '@rollup/plugin-json';
import BaseBuilder from '../common/baseBuilder';

class Tci18nHttpBuilder extends BaseBuilder {
    outputOptions: OutputOptions[];

    inputOptions: RollupOptions;
    
    inputOptionsCDN?: RollupOptions;

    outputOptionsCDN?: OutputOptions[];

    inputPath = path.join(process.cwd(), '../packages/tci18n-http/index.ts');

    distPath = path.join(process.cwd(), '../packages/tci18n-http/dist');

    cdnPath = path.join(process.cwd(), '../packages/tci18n-http/cdn-dist');

    packagePath = path.join(process.cwd(), '../packages/tci18n-http/package.json');
    constructor() {
        super()
        this.inputOptions = {
            input: this.inputPath,
            external: [
                'axios',
                'chalk'
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
        ]
        this.inputOptionsCDN = {
            input: this.inputPath,
            external: [
                'axios'
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
        const packageJson = require(this.packagePath)
        this.outputOptionsCDN = [
            {
                format: 'umd',
                name: 'tci18nHttp',
                globals: {
                    axios: 'axios',
                },
                dir: this.cdnPath,
                entryFileNames: `tci18n-http@${packageJson.version.replace(/\./g, '.')}.js`
            }
        ]
    }

    async build() {
        await this.rollup(this.inputOptions, this.outputOptions);
        if (this.inputOptionsCDN && this.outputOptionsCDN) {
            await this.rollup(this.inputOptionsCDN, this.outputOptionsCDN);
        }
    }
}

export default Tci18nHttpBuilder;
