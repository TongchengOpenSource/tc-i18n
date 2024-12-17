import path from 'path';
import BaseTransform from '../BaseTransform';

const transform = new BaseTransform();
function tci18nLoader (this: any, content: any, map: any, meta: any) {
    const callback = this.async();
    if (this.request) {
        const {
            configOptions,
            entryPaths,
            excludePaths,
            extractOnly
        } = this.query;
        const isMatch = transform.isMatchPath(this.resourcePath, entryPaths, excludePaths)
        if (isMatch) {
            const type = transform.getFileType(this.resourcePath)
            const filePath = this.resourcePath.replace((this.rootContext || this.options.context) + path.sep, '')
            if (type) {
                transform.replaceSourceCode(
                    content,
                    type,
                    configOptions,
                    BaseTransform.formatPath(filePath),
                    extractOnly
                ).then((source) => {                        
                    callback(null, source, map, meta);
                });
                return;
            }
        }
    }
    callback(null, content, map, meta);
};

export default tci18nLoader;