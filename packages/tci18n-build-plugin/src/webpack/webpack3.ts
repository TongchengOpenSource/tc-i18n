import path from 'path';
import BaseTransform from '../BaseTransform';

type Options = {
    configPath?: string;
    extractOnly?: boolean;
}
class Tci18nPlugin {
    options: Options;
    entryPaths: string[];
    excludePaths: string[];
    configOptions: Record<string, any>;
    constructor(options: Record<string, any> = {}) {
        this.options = options
        const { 
            configOptions,
            entryPaths,
            excludePaths
        } = BaseTransform.getConfigOptions(options.configPath);
        this.entryPaths = entryPaths;
        this.excludePaths = excludePaths;
        this.configOptions = configOptions
    }
    apply(compiler) {
        compiler.options.module.rules.push({
            test: /\.(vue|ts|tsx|js|jsx)$/i,
            exclude: /\/node_modules\//,
            use: [{
                loader: path.resolve(__dirname, './loader'),
                    options: {
                        configOptions: this.configOptions,
                        entryPaths: this.entryPaths,
                        excludePaths: this.excludePaths,
                        extractOnly: this.options.extractOnly || false
                    }
            }],
        });
    }
}

export default (options: Record<string, any> = {}) => {
    return new Tci18nPlugin(options)
};