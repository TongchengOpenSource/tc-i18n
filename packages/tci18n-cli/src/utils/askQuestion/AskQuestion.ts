import BaseInquirer from './BaseInquirer'

class AskQuestion extends BaseInquirer {
    constructor() {
        super();
    }

    /**
     * 是否确认覆盖配置文件
     * @returns 
     */
    async isConfirmCoverConfig() {
        const { confirm } = await this.confirm('存在配置文件，是否覆盖？');
        return confirm;
    }

    /**
     * 选择框架
     * @returns 
     */
    async chooseFramework() {
        const { framework } = await this.list('请选择框架', ['VUE2', 'VUE3', 'REACT', '静态HTML', '微信小程序'], 'framework');
        return framework;
    }

    /**
     * 选择语种
     * @returns 
     */
    async chooseLocale() {
        const { locale } = await this.list('请选择项目当前语种', ['中文', '英文'], 'locale');
        const localeMap = {
            中文: 'zh-cn',
            英文: 'en-us',
        }
        return localeMap[locale] || 'zh-cn';
    }

    /**
     * 选择是否删除output文件夹
     * @returns 
     */
    async chooseDeleteOutput() {
        const { confirm } = await this.confirm('是否删除存在的输出目录');
        return confirm;
    }
}

export default AskQuestion;