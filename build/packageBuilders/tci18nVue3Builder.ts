import path from 'path';
import type { OutputOptions, RollupOptions } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import esbuild from 'rollup-plugin-esbuild';
import json from '@rollup/plugin-json';
import babel from '@rollup/plugin-babel';
import BaseBuilder from '../common/baseBuilder';

class Tci18nVue3Builder extends BaseBuilder {
    outputOptions: OutputOptions[];

    inputOptions: RollupOptions;

    inputPath = path.join(process.cwd(), '../packages/tci18n-vue3/index.ts');

    distPath = path.join(process.cwd(), '../packages/tci18n-vue3/dist');

    constructor() {
        super()
        this.inputOptions = {
            input: this.inputPath,
            external: [
                '@tc-i18n/intl'
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
    }

    async build() {
        await this.rollup(this.inputOptions, this.outputOptions);
    }
}

export default Tci18nVue3Builder;