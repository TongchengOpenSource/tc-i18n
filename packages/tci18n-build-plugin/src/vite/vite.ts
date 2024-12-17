import path from 'path';
import fs from 'fs';
import { createFilter } from '@rollup/pluginutils';
import MagicString from 'magic-string';
import BaseTransform from '../BaseTransform';
import Utils from '../Utils';

type Options = {
    configPath?: string;
    extractOnly?: boolean;
}

const transform = new BaseTransform();
export default function tci18nPlugin(options: Options = {}) {
    const { 
        configOptions,
        entryPaths,
        excludePaths
    } = BaseTransform.getConfigOptions(options.configPath);
    const filter = createFilter(entryPaths, excludePaths)
    return {
        name: 'vite-plugin-tci18n-replace',
        enforce: 'pre',
        async load(id: string) {
            const { query } = Utils.parseVueRequest(id)
            const isMatch = filter(id)
            const filePath = id.replace(process.cwd() + path.sep, '');
            const type = transform.getFileType(filePath);
            if (isMatch && !query.vue && type && transform.isMatchExt(filePath)) {
                try {
                    const code = fs.readFileSync(id, 'utf-8')
                    const source = await transform.replaceSourceCode(
                        code,
                        type,
                        configOptions,
                        BaseTransform.formatPath(filePath),
                        options.extractOnly || false
                    );
                    const s = new MagicString(source);
                    return {
                        code: source,
                        map: s.generateMap()
                    }
                } catch(e) {
                    console.error(e);
                }
            }
            return null

        },
    }
}