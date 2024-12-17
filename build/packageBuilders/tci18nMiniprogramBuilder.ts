import path from 'path';
import type { OutputOptions, RollupOptions } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import esbuild from 'rollup-plugin-esbuild';
import json from '@rollup/plugin-json';
import BaseBuilder from '../common/baseBuilder';

class Tci18nMiniprogramBuilder extends BaseBuilder {

    outputOptions: OutputOptions[];
    
    inputOptions: RollupOptions;

    inputPath = path.join(process.cwd(), '../packages/tci18n-miniprogram/index.js');

    distPath = path.join(process.cwd(), '../packages/tci18n-miniprogram/dist');

    constructor() {
        super()
        this.inputOptions = {
            input: this.inputPath,
            external: [],
            treeshake: true,
            plugins: [
                commonjs(),
                esbuild(),
                nodeResolve({
                    extensions: [".mjs", ".js", ".json", ".ts"],
                    preferBuiltins: true,
                }),
                babel({
                    presets: ['@babel/preset-env'],
                }),
                json(),
            ]
        }
        this.outputOptions = [
            {
                format: 'cjs',
                dir: this.distPath,
                entryFileNames: `index.cjs`,
                assetFileNames: `[name][extname]`,
            },
            {
                format: 'es',
                dir: this.distPath,
                entryFileNames: `index.js`
            },
        ]
    }

    async build() {
        await this.rollup(this.inputOptions, this.outputOptions);
    }
}

export default Tci18nMiniprogramBuilder;
