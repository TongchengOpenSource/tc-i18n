import Transformer from '@tc-i18n/core';
import type { Tci18nConfig, Plugin } from '@tc-i18n/core';
import { glob } from 'glob';
import path from 'path';
import { log, AskQuestion, CodeFile, CodeFileItem, ConfigFile } from 'utils';

class Transform {
    defaultExts = ['js', 'ts', 'tsx', 'jsx', 'vue', 'html', 'wxml', 'wxs'];
    configFile = new ConfigFile();
    codeFile = new CodeFile();
    askQuestion = new AskQuestion();
    tci18nConfig: Tci18nConfig;
    transformer?: Transformer;
    constructor() {
        this.tci18nConfig = this.configFile.readTci18nConfig();
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

    async start(options: Record<string, boolean>) {
        const { extractOnly, primaryLocale = 'zh-cn', output } = this.tci18nConfig;
        this.transformer = new Transformer(this.tci18nConfig);
        // await this.waitPluginLoaded();
        if (this.transformer.pluginLoadStatus === 'loading') {
            const plugins = await this.transformer.waitPluginLoaded();
            this.handleExts(plugins);
        }
        // 1. glob匹配文件
        const files = this.getMatchFileByGlob();
        // 2. 批量读取文件内容
        const filesContent = await this.codeFile.batchReadCodeFiles(files);
        // 3-1. 批量转换文件内容，调用tci18n-core
        log.warn(`🚀已匹配到${filesContent.length}个文件，正在转换代码`);
        const transformedCodeList = await this.transformCode(filesContent);
        filesContent.forEach((file, index) => {
            const { hasChange, hasError } = transformedCodeList[index];
            const { filePath } = file;
            if (hasError) {
                log.error(`📄${filePath} 转换失败`);
            } else if (hasChange) {
                log.blue(`📄${filePath} 转换成功`);
            } else {
                log.info(`📄${filePath} 无需转换`);
            }
        });
        log.success(`👌文件解析完成～`);
        // 3-2. 导出错误信息
        if (this.transformer.errorData.length > 0) {
            const errorFilePath = await this.codeFile.generateErrorJSON(this.transformer.errorData);
            log.error(`共${this.transformer.errorData.length}文件解析失败，失败信息请查看 ${errorFilePath} 文件`);
        } else {
            this.codeFile.deleteErrorJSON();
        }
        // 4-1. 输出到output目录
        if (output) {
            log.warn(`🚀已配置 output: ${output}，正在将项目导出到${output}文件夹下`);
            await this.outputFile(filesContent, transformedCodeList);
            log.success(`👌项目已导出到${output}文件夹下～`);
        }
        // 4-2. 替换源码
        if (!extractOnly) {
            log.warn(`🚀已配置 extractOnly: false，正在替换源码`);
            await this.replaceSourceCode(filesContent, transformedCodeList);
            log.success('👌源码替换完成～');
        }
        // 5. 生成语料文件
        const langsNum = Object.keys(this.transformer.primaryLocaleData).length;
        if (langsNum > 0) {
            log.warn(`🚀总共提取到 ${langsNum} 条语料，正在生成语料资源`);
            const primaryJSON = {
                [primaryLocale]: this.transformer.primaryLocaleData,
            };
            const langsJsonFilePath = await this.codeFile.generatePrimaryJSON(primaryJSON);
            log.success(`👌语料已存入 ${langsJsonFilePath} 文件中。`);
        }

        log.success(`🏎️ transform命令执行完毕～`);
    }

    async transformCode(filesContent: CodeFileItem[]) {
        const promises: Promise<{code: string, hasError: boolean, hasChange: boolean}>[] = [];
        filesContent.forEach((fileContentItem: CodeFileItem) => {
            const { ext, code, filePath } = fileContentItem;
            promises.push(this.transformer!.transformCode(code, ext, filePath));
        });
        return await Promise.all(promises);
    }

    filterChangeFiles(filesContent: CodeFileItem[], transformedCodeList: {code: string, hasChange: boolean}[]) {
        return filesContent
            .map((item, index) => {
                const transformedCodeItem = transformedCodeList[index];
                let hasChange = false;
                let code = item.code;
                if (transformedCodeItem) {
                    hasChange = transformedCodeItem.hasChange;
                    code = transformedCodeItem.code;
                }
                return {
                    ...item,
                    hasChange,
                    code,
                }
            });
    }

    async outputFile(filesContent: CodeFileItem[], transformedCodeList: {code: string, hasError: boolean, hasChange: boolean}[]) {
        const { output, framework } = this.tci18nConfig;
        const codeFiles = this.filterChangeFiles(filesContent, transformedCodeList).map((item) => ({
            ...item,
            filePath: path.join(output!, item.filePath)
        }));
        // 导出替换的文件
        await this.codeFile.batchWriteCodeFiles(codeFiles);

        // 导出其他文件
        const otherFiles = this.getOtherFileByGlob();
        await this.codeFile.batchCopyFile(otherFiles.map((file) => ({
            source: file,
            target: path.join(output!, file),
        })));
        if (framework === 'miniprogram') {
            // 需要生成wxs
            await this.codeFile.generateWXS(output!);
        }
    }
    
    /**
     * 替换源码
     * @param filesContent 
     * @param transformedCodeList 
     */
    async replaceSourceCode(filesContent: CodeFileItem[], transformedCodeList: {code: string, hasError: boolean, hasChange: boolean}[]) {
        // 只需要替换有变化的文件
        const changeFiles = this.filterChangeFiles(filesContent, transformedCodeList).filter((item) => item.hasChange);
        await this.codeFile.batchWriteCodeFiles(changeFiles);
    }

    /**
     * 通过glob匹配文件需要提取的文件
     * @returns 
     */
    getMatchFileByGlob() {
        const { entry, exclude } = this.tci18nConfig;
        if (entry.length === 0) {
            log.warn('当前entry为空，没有匹配到文件。');
            process.exit(1);
        }
        const globEntry = entry.map((item) => {
            if (!/\.\w+$/.test(item)) {
                return `${item}/**/*.{${this.defaultExts.join(',')}}`;
            }
            return item;
        });
        const globExclude = exclude.map((item) => {
            if (!/\.\w+$/.test(item)) {
                return `${item}/**`;
            }
            return `${item}`;
        });
        let files: string[] = [];
        globEntry.forEach((entryItem) => {
            files = files.concat(glob.sync(entryItem, {
                ignore: globExclude
            }));
        });
        return files;
    }

    /**
     * 通过glob匹配不需要提取的文件
     */
    getOtherFileByGlob(): string[] {
        const { entry, exclude } = this.tci18nConfig;
        const globEntry = entry.map((item) => {
            if (!/\.\w+$/.test(item)) {
                return `${item}/**/*.{${this.defaultExts.join(',')}}`;
            }
            return item;
        });
        let ignoreGlob = [...globEntry, '**/node_modules/**', 'dist/**', '**/miniprogram_npm/**', 'locale/**', 'tci18n.config.js'];

        const excludeGlob = (exclude || []).map((item) => {
            if (/\.\w+$/.test(item)) {
                return `${item}`
            }
            return `${item}/**/*.{${this.defaultExts.join(',')}}`;
        });
        const excludeFile = excludeGlob.reduce<string[]>((a, b) => {
            const files = glob.sync(b, {
                ignore: ignoreGlob
            });
            return a.concat(files);
        }, []); 
        const otherFile = glob.sync('**/*', {
            ignore: ignoreGlob
        });


        return [...excludeFile, ...otherFile];
    }
}

export default Transform;