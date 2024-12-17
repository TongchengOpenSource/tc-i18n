import { intl, useI18n } from '@tc-i18n/intl';


// 静态html项目
const tci18nVueI18n = (options: any, Vue?: any) => {
    intl.init(options)
    Vue.prototype.$t = intl.$t.bind(intl)
    return null
}

// 脚手架项目
const TcI18n = {
    install(Vue: any, options: any) {
        intl.init(options)
        Vue.prototype.$t = intl.$t.bind(intl);
    }
}

export { TcI18n as default, intl, tci18nVueI18n, useI18n};
