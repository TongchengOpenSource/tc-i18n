import path from 'path';
import fs from 'fs';
import type { OutputOptions, RollupOptions } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import babel from '@rollup/plugin-babel';
import esbuild from 'rollup-plugin-esbuild';
import alias from '@rollup/plugin-alias';
import BaseBuilder from '../common/baseBuilder';

class Tci18nCoreBuilder extends BaseBuilder {
    outputOptions: OutputOptions[];

    inputOptions: RollupOptions;

    indexPath = path.join(process.cwd(), '../packages/tci18n-core/src/index.ts');

    parsePath = path.join(process.cwd(), '../packages/tci18n-core/index.ts');

    distPath = path.join(process.cwd(), '../packages/tci18n-core/dist');
    constructor() {
        super()
        this.inputOptions = {
            input: {
                index: this.indexPath,
                parse: this.parsePath,
            },
            external: [
                'glob',
                'prettier',
                '@babel/core',
                '@babel/preset-env',
                '@babel/preset-typescript',
            ],
            plugins: [
                alias({
                    entries: [
                        { find: 'src', replacement: path.join(process.cwd(), '..', 'packages', 'tci18n-core', 'src') },
                        { find: 'parse5', replacement: path.join(process.cwd(), '..', 'packages', 'tci18n-core', 'plugins', 'parse5') },
                        { find: 'parse5/serializer', replacement: path.join(process.cwd(), '..', 'packages', 'tci18n-core', 'plugins', 'parse5', 'serializer') },
                        { find: 'notify', replacement: path.join(process.cwd(), '..', 'packages', 'tci18n-core', 'plugins', 'notify') },
                    ]
                }),
                nodeResolve({
                    extensions: [".mjs", ".js", ".json", ".ts"],
                    preferBuiltins: true,
                }),
                commonjs({
                    requireReturnsDefault: 'auto',
                }),
                esbuild(),
                babel({
                    extensions: ['.ts', '.js'],
                    presets: [
                        [
                            '@babel/preset-env',
                            {
                                targets: '> 0.25%, not dead'
                            }
                        ]
                    ],
                }),
                json(),
            ]
        }
        this.outputOptions = [
            {
                format: 'cjs',
                dir: this.distPath,
                entryFileNames: `[name].cjs`,
                chunkFileNames: `[name]-[hash].cjs`,
                // exports: 'default'
            },
            {
                format: 'es',
                dir: this.distPath,
                entryFileNames: `[name].mjs`,
                chunkFileNames: `[name]-[hash].mjs`,
            },
        ]
    }

    async build() {
        this.deleteFolder(this.distPath);
        await this.rollup(this.inputOptions, this.outputOptions);
    }
}

export default Tci18nCoreBuilder;