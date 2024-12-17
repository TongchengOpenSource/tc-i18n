import type { Tci18nConfig } from '@tc-i18n/core';
import path from 'path';
import log from '../log';
import { defaultConfig } from '../tci18nConfig';
import BaseFile from './BaseFile';

/**
 * 读取配置文件
 */
class ConfigFile extends BaseFile {
    configFileName = 'tci18n.config.json';

    configFilePath = path.join(process.cwd(), this.configFileName);

    constructor() {
        super();
    }

    /**
     * 读取配置文件
     * @returns 
     */
    readTci18nConfig(): Tci18nConfig {
        try {
            if (!this.hasTci18nConfig()) {
                // 不存在配置文件，退出程序
                log.error(`${this.configFileName}文件不存在，请先执行tcapp-i18n init`);
                process.exit(3);
            }
            const tci18nConfig: Tci18nConfig = JSON.parse(this.readSync(this.configFilePath));
            return {
                ...defaultConfig,
                ...tci18nConfig,
            }
        } catch(e) {
            log.error(`${this.configFileName}配置文件格式错误，请检查。`);
            process.exit(3);
        }
    }

    /**
     * 写入配置文件
     * @param content 
     */
    async writeTci18nConfig(content: string) {
        try {
            await this.write(this.configFilePath, content);
        } catch(e) {
            log.error(`写入${this.configFileName}文件失败`);
            process.exit(3);
        }
    }

    /**
     * 判断是否存在配置文件
     * @returns 
     */
    hasTci18nConfig() {
        return this.existsSync(this.configFilePath);
    }
};

export default ConfigFile;