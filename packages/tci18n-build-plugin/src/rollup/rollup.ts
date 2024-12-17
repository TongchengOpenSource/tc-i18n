import path from 'path';
import BaseTransform from '../BaseTransform'

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
    } = BaseTransform.getConfigOptions(options.configPath)
    return {
        name: 'rollup-plugin-tci18n-replace',
        async transform(code: string, id: string) {
            const isMatch = transform.isMatchPath(id, entryPaths, excludePaths)
            if (isMatch) {
                const filePath = id.replace(process.cwd() + path.sep, '')
                const type = transform.getFileType(filePath)
                if (type) {
                    const source = await transform.replaceSourceCode(
                        code,
                        type,
                        configOptions,
                        BaseTransform.formatPath(filePath),
                        options.extractOnly || false
                    );
                    return {
                        code: source,
                        map: null
                    }
                }
            }
            return {
                code: code,
                map: null
            }
        }
    }
}