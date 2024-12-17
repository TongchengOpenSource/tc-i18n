import path from 'path';
import type { OutputOptions, RollupOptions } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import esbuild from 'rollup-plugin-esbuild';
import json from '@rollup/plugin-json';
import BaseBuilder from '../common/baseBuilder';

class Tci18nPluginBuilder extends BaseBuilder {
    outputOptions: OutputOptions[];

    inputOptions: RollupOptions;

    constructor() {
        super()
        this.inputOptions = {
            input: path.join(process.cwd(), '../packages/tci18n-build-plugin/index.ts'),
            external: ['@tc-i18n/core'],
            plugins: [
                esbuild(),
                commonjs(),
                babel({
                    extensions: ['.ts'],
                    presets: ['@babel/preset-env'],
                    plugins: ['@babel/plugin-transform-classes'],
                }),
                nodeResolve({
                    preferBuiltins: true
                }),
                json(),
            ]
        }
        this.outputOptions = [
            {
                format: 'cjs',
                dir: path.join(process.cwd(), '../packages/tci18n-build-plugin/dist'),
                entryFileNames: `index.cjs`,
            },
            {
                format: 'es',
                dir: path.join(process.cwd(), '../packages/tci18n-build-plugin/dist'),
                entryFileNames: `index.mjs`,
            }
        ]
    }

    async build() {
        await this.rollup(this.inputOptions, this.outputOptions);
        await this.buildLoader();
    }

    async buildLoader() {
        await this.rollup({
            ...this.inputOptions,
            input: path.join(process.cwd(), '../packages/tci18n-build-plugin/src/webpack/loader.ts'),
        }, [{
            format: 'cjs',
            dir: path.join(process.cwd(), '../packages/tci18n-build-plugin/dist'),
            entryFileNames: `loader.js`,
        }]);
    }
}

export default Tci18nPluginBuilder;