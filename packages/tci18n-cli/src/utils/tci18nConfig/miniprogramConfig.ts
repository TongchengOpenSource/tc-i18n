import defaultConfig from './defaultConfig';

export default {
    ...defaultConfig,
    entry: ['pages', 'app.[js,json]'],
    output: 'dist',
    ignoreAttrs: ['style', 'data-url', 'navigateTo'],
    importCode: "import { intl } from '@tc-i18n/miniprogram';",
    i18nMethod: 't',
    framework: 'miniprogram',
}