import { minimatch } from 'minimatch';
import Transformer from '@tc-i18n/core';
import type { Config, SOURCE_TYPE, Plugin } from '@tc-i18n/core';
import Utils from './Utils';

class BaseTransform extends Utils {
    transformer?: Transformer;

    defaultExts = ['js', 'ts', 'tsx', 'jsx', 'vue', 'html', 'wxml', 'wxs'];
    
    suffixRegex = /.(\w+)$/;

    /**
     * 获取配置文件
     * @param configRelativePath 
     * @returns 
     */
    static getConfigOptions(configRelativePath: string = './tci18n.config.json') {
        let workspacePath = BaseTransform.resolve(process.cwd(), configRelativePath, '..');
        let configPath = BaseTransform.resolve(process.cwd(), configRelativePath);
        if (BaseTransform.existsSync(configPath)) {
            try {
                const configOptions = JSON.parse(BaseTransform.readFileSync(configPath));
                const formatGlobPath = (globPath) => {
                    if (/\.\w+$/.test(globPath)) {
                        return BaseTransform.join(workspacePath, globPath)
                    }
                    return BaseTransform.join(workspacePath, `${globPath}/**/*`)
                }
                const entryPaths = configOptions.entry.map((entryPath: string) => BaseTransform.formatPath(formatGlobPath(entryPath)));
                const excludePaths = configOptions.exclude.map((excludePath: string) => BaseTransform.formatPath(formatGlobPath(excludePath)));
                return {
                    configOptions,
                    entryPaths,
                    excludePaths
                };
            } catch(e) {
                throw new Error('tci18n.config配置文件解析错误，请检查配置文件是否符合json格式');
            }
        } else {
            throw new Error('tci18n.config配置文件不存在');
        }
    }

    filterMultiArr(ext1: string[], ext2: string[]) {
        return [...new Set([...ext1, ...ext2])];
    }

    handleExts(plugins: Plugin[]) {
        plugins.forEach((plugin) => {
            const { sourceTypeScope, exts } = plugin;
            if (exts) {
                this.defaultExts = this.filterMultiArr(this.defaultExts, exts);
            } else if (Array.isArray(sourceTypeScope)) {
                const pluginExts = sourceTypeScope?.map((scope) => {
                    return scope.split(':')[0].trim();
                });
                this.defaultExts = this.filterMultiArr(this.defaultExts, pluginExts);
            }
        });
    }

    /**
     * 替换源码
     * @param code 源代码
     * @param type 代码类型
     * @param options tci18n配置
     * @param filePath 文件路径
     * @returns 
     */
    async replaceSourceCode(code: string, type: SOURCE_TYPE, options: Config, filePath: string, extractOnly: boolean = false) {
        if (!this.transformer) {
            this.transformer = new Transformer(options);
            this.transformer.extractOnly = extractOnly;
            if (this.transformer.pluginLoadStatus === 'loading') {
                const plugins = await this.transformer.waitPluginLoaded();
                this.handleExts(plugins);
            }
        }
        if (this.isMatchExt(filePath)) {
            const { code: newCode, hasChange } = await this.transformer.transformCode(code, type, filePath);
            if (hasChange) {
                return newCode;
            }
        }
        return code;
    }

    /**
     * 获取文件类型
     * @param filePath 
     * @returns 
     */
    getFileType(filePath: string): SOURCE_TYPE | '' {
        this.suffixRegex.test(filePath);
        return RegExp.$1 as SOURCE_TYPE | '';
    }

    /**
     * 判断当前文件是否匹配
     * @param filePath 当前文件路径
     * @param entryPaths entry配置的路径
     * @param excludePaths exclude配置的路径
     * @returns 
     */
    isMatchPath(filePath: string, entryPaths: string[] = [], excludePaths: string[] = []) {
        filePath = filePath.split('?')[0];
        const isInclude = !!entryPaths.some((entryPath) => minimatch(Utils.formatPath(filePath), entryPath));
        const isExclude = !!excludePaths.some((excludePath) => minimatch(Utils.formatPath(filePath), excludePath));
        return isInclude && !isExclude
    }

    /**
     * 匹配文件类型，跟@tc-i18n/cli保持一致
     * @param filePath 
     * @returns 
     */
    isMatchExt(filePath: string) {
        return this.defaultExts.includes(this.getFileType(filePath));
    }
}

export default BaseTransform;