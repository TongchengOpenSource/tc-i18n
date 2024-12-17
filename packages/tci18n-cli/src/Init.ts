import { 
    log,
    htmlConfig,
    miniprogramConfig,
    reactConfig,
    vue2Config,
    vue3Config,
    AskQuestion,
    ConfigFile
} from 'utils';

class Init {
    configFile = new ConfigFile();
    askQuestion = new AskQuestion();

    async start() {
        const hasConfig = this.configFile.hasTci18nConfig();
        let isCover = false;
        if (hasConfig) {
            isCover = await this.askQuestion.isConfirmCoverConfig();
        }
        if (!hasConfig || isCover) {
            const framework = await this.askQuestion.chooseFramework();
            let config: any = {};
            switch (framework) {
                case '静态HTML': config = htmlConfig; break;
                case '微信小程序': config = miniprogramConfig; break;
                case 'VUE2': config = vue2Config; break;
                case 'VUE3': config = vue3Config; break;
                case 'REACT': config = reactConfig; break;
            }
            const locale = await this.askQuestion.chooseLocale();
            config.primaryLocale = locale || 'zh-cn';
            const tci18nConfig = JSON.stringify(config, null, 4);
            await this.configFile.writeTci18nConfig(tci18nConfig);
            log.success('初始化成功，配置文件已生成。');
        }
    }
}

export default Init;