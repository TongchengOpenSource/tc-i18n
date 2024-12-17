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

class Tci18nCliBuilder extends BaseBuilder {
    outputOptions: OutputOptions[];

    inputOptions: RollupOptions;

    cliPath = path.join(process.cwd(), '../packages/tci18n-cli/cli.ts');

    indexPath = path.join(process.cwd(), '../packages/tci18n-cli/index.ts');

    distPath = path.join(process.cwd(), '../packages/tci18n-cli/dist');
    constructor() {
        super()
        this.inputOptions = {
            input: {
                cli: this.cliPath,
                index: this.indexPath,
            },
            external: [
                '@tc-i18n/core',
                'glob',
            ],
            plugins: [
                alias({
                    entries: [
                        { find: 'utils', replacement: path.join(process.cwd(), '../packages/tci18n-cli/src/utils') },
                    ]
                }),
                esbuild(),
                commonjs(),
                nodeResolve({
                    extensions: [".mjs", ".js", ".json", ".ts"],
                    preferBuiltins: true
                }),
                babel({
                    extensions: ['.ts', '.js'],
                    presets: [['@babel/preset-env', { targets: 'node > 9' }]],
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
            }
        ]
    }

    async build() {
        this.deleteFolder(this.distPath);
        await this.rollup(this.inputOptions, this.outputOptions);
        const wxs = fs.readFileSync(path.join(process.cwd(), '../packages/tci18n-cli/src/utils/file/wxs.js'), 'utf-8');
        fs.writeFileSync(path.join(process.cwd(), '../packages/tci18n-cli/dist/wxs.js'), wxs);
    }
}

export default Tci18nCliBuilder;