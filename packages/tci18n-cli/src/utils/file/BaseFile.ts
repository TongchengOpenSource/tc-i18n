import fs from 'fs-extra';
import { SOURCE_TYPE } from '@tc-i18n/core';

class BaseFile {
    getExt(filePath: string): SOURCE_TYPE {
        return (filePath.split('.').pop() as SOURCE_TYPE) || SOURCE_TYPE.JS;
    }

    /**
     * 异步读取文件
     * @param filePath 
     * @returns 
     */
    async read(filePath: string) {
        try {
            return await fs.readFile(filePath, {
                encoding: 'utf-8',
            });
        } catch(e) {
            throw new Error(`读取${filePath}文件失败`);
        }
    }

    /**
     * 同步读取文件
     * @param filePath 
     * @returns 
     */
    readSync(filePath: string) {
        try {
            return fs.readFileSync(filePath, {
                encoding: 'utf-8'
            });
        } catch(e) {
            throw new Error(`读取${filePath}文件失败`);
        }
    }

    /**
     * 异步写入文件
     * @param filePath 
     * @param content 
     * @returns 
     */
    async write(filePath: string, content: string) {
        try {
            return await fs.writeFile(filePath, content, {
                encoding: 'utf-8',
            });
        } catch(e) {
            throw new Error(`写入${filePath}文件失败`);
        }
    }

    /**
     * 删除文件/文件夹
     * @param filePath 
     */
    async remove(filePath: string) {
        await fs.remove(filePath);
    }

    /**
     * 是否是文件夹
     * @param filePath 
     * @returns 
     */
    isFolder(filePath: string) {
        return !this.isFile(filePath);
    }

    /**
     * 是否是文件
     * @param filePath 
     * @returns
     */
    isFile(filePath: string) {
        return /\.\w+$/.test(filePath);
    }

    /**
     * 异步判断文件是否存在
     * @param filePath 
     * @returns 
     */
    async exists(filePath: string) {
        return await fs.pathExists(filePath);
    }

    /**
     * 同步判断文件是否存在
     * @param filePath 
     * @returns 
     */
    existsSync(filePath: string) {
        return fs.existsSync(filePath);
    }

    /**
     * 异步创建文件/文件夹
     * @param filePath 
     */
    async createFile(filePath: string) {
        if (this.isFile(filePath)) {
            await fs.createFile(filePath);
        } else if (this.isFolder(filePath)) {
            await fs.mkdir(filePath);
        }
    }

    /**
     * 同步创建文件/文件夹
     * @param filePath 
     */
    createFileSync(filePath: string) {
        if (this.isFile(filePath)) {
            fs.createFileSync(filePath);
        } else if (this.isFolder(filePath)) {
            fs.mkdirSync(filePath, { recursive: true });
        }
    }

    /**
     * 复制文件
     * @param src 
     * @param dest 
     */
    async copyFile(src: string, dest: string) {
        if (!this.existsSync(src)) {
            throw new Error(`不存在${src}目标文件`);
        }
        if (this.isFolder(dest)) {
            // 复制文件夹
            if (!this.existsSync(dest)) {
                this.createFileSync(dest);
            }
        } else {
            // 复制文件
            if (!this.existsSync(dest)) {
                this.createFileSync(dest);
            }
            await fs.copyFile(src, dest);
        }
    }
}

export default BaseFile;