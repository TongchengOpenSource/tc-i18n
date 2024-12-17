import path from 'path';
import type { OutputOptions, RollupOptions } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import esbuild from 'rollup-plugin-esbuild';
import json from '@rollup/plugin-json';
import BaseBuilder from '../common/baseBuilder';

class Tci18nShareBuilder extends BaseBuilder {
    distPath = path.join(process.cwd(), '../packages/tci18n-share/dist');
    constructor() {
        super()
    }

    async build() {
        await this.rollupOptions('index', 'tci18n-share', path.join(process.cwd(), '../packages/tci18n-share/index.ts'));
    }

    async rollupOptions(name: string, winName: string, inputPath: string) {
        const inputOptions: RollupOptions = {
            input: inputPath,
            external: ['vue'],
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
        const outputOptions: OutputOptions[] = [
            {
                format: 'es',
                dir: this.distPath,
                entryFileNames: `${name}.mjs`,
            },
            {
                format: 'umd',
                dir: this.distPath,
                name: winName,
                entryFileNames: `${name}.js`,
            }
        ]
        await this.rollup(inputOptions, outputOptions);
    }
}

export default Tci18nShareBuilder;