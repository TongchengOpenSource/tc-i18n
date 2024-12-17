import { intl, useI18n } from '@tc-i18n/intl';

const TcI18n = {
    install(app: any, options: any) {
        intl.init(options);
        app.config.globalProperties.$t = intl.$t.bind(intl)
    }
}

export { TcI18n as default, intl, useI18n }
