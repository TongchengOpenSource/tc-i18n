import path from 'path';
import log from 'utils/log';
import BaseFile from './BaseFile';
import { SOURCE_TYPE } from '@tc-i18n/core';


export interface CodeFileItem {
    filePath: string,
    ext: SOURCE_TYPE,
    code: string
}

/**
 * 读取代码文件
 */
class CodeFile extends BaseFile {
    totalFiles:string[] = [];
    successFiles:string[] = [];
    failFiles:string[] = [];

    async readCodeFile(entryFilePath: string): Promise<CodeFileItem | undefined> {
        const filePath = path.join(process.cwd(), entryFilePath);
        const isExist = await this.exists(filePath);
        if (isExist) {
            try {
                const code = await this.read(filePath);
                this.successFiles.push(filePath);
                return {
                    filePath: entryFilePath,
                    ext: this.getExt(filePath),
                    code
                };
            } catch(e) {
                log.error(`读取${filePath}文件失败，跳过。`);
                this.failFiles.push(filePath);
            }
        } else {
            log.error(`${filePath}文件不存在，跳过。`);
            this.failFiles.push(filePath);
        }
    }

    /**
     * 批量读取代码文件
     * @param entryFilePaths 
     * @returns 
     */
    async batchReadCodeFiles(entryFilePaths: string[]): Promise<CodeFileItem[]> {
        this.totalFiles = [...entryFilePaths];
        const promises: Promise<CodeFileItem | undefined>[] = [];
        entryFilePaths.forEach(async (entryFilePath) => {
            promises.push(this.readCodeFile(entryFilePath));
        });
        const filesContent = await Promise.all(promises);
        return filesContent.filter((item) => item) as CodeFileItem[];
    }

    /**
     * 写入代码文件
     * @param filePath 
     * @param content 
     */
    async writeCodeFile(filePath: string, content: string) {
        try {
            if (!this.existsSync(filePath)) {
                this.createFileSync(filePath);
            }
            await this.write(filePath, content);
        } catch(e) {
            log.error(`写入${filePath}文件失败`);
        }
    }

    batchCopyFile(files: {source: string, target: string}[]) {
        const promises: Promise<void>[] = [];
        files.forEach(({ source, target }) => {
            promises.push(this.copyFile(source, target));
        });
        return Promise.all(promises);
    }

    /**
     * 批量写入代码文件
     * @param files
     */
    async batchWriteCodeFiles(files: CodeFileItem[]) {
        const promises: Promise<void>[] = [];
        files.forEach((file) => {
            promises.push(this.writeCodeFile(file.filePath, file.code));
        });
        await Promise.all(promises);
    }

    /**
     * 生成langs.json文件
     * @param primaryJSON 
     * @returns 
     */
    async generatePrimaryJSON(primaryJSON: Record<string, Record<string, string>>) {
        const langsJsonFilePath = path.join(process.cwd(), 'locale', 'langs.json');
        const isExists = await this.exists(langsJsonFilePath);
        if (!isExists) {
            await this.createFile(langsJsonFilePath);
        }
        await this.write(langsJsonFilePath, JSON.stringify(primaryJSON, null, 4));
        return langsJsonFilePath;
    }

    /**
     * 获取主语言json
     */
    async getPrimaryJSON() {
        const langsJsonFilePath = path.join(process.cwd(), 'locale', 'langs.json');
        if (!this.existsSync(langsJsonFilePath)) {
            // 不存在langs.json文件，退出程序
            log.error('langs.json文件不存在，请先执行tcapp-i18n transform');
            process.exit(3);
        }
        return await this.read(langsJsonFilePath);
    }

    /**
     * 生成error.json文件
     * @param errorJSON 
     * @returns 
     */
    async generateErrorJSON(errorJSON: any) {
        const errorFilePath = path.join(process.cwd(), 'locale', 'error.json');
        const isExists = await this.exists(errorFilePath);
        if (!isExists) {
            await this.createFile(errorFilePath);
        }
        await this.write(errorFilePath, JSON.stringify(errorJSON, null, 4));
        return errorFilePath;
    }

    /**
     * 删除error.json文件
     */
    async deleteErrorJSON() {
        const errorFilePath = path.join(process.cwd(), 'locale', 'error.json');
        if (this.existsSync(errorFilePath)) {
            await this.remove(errorFilePath);
        }
    }

    /**
     * 生成wxs文件 小程序用
     * @param filePath 
     */
    async generateWXS(filePath: string) {
        const wxs = this.readSync(path.join(__dirname, 'wxs.js'));
        await this.write(path.join(filePath, 'tci18n.wxs'), wxs);
    }
}

export default CodeFile;