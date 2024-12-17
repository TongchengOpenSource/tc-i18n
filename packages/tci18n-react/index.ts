import { intl, useI18n } from '@tc-i18n/intl';

const TcI18n = (options: any) => {
    intl.init(options);
}

export { TcI18n as default, intl, useI18n };