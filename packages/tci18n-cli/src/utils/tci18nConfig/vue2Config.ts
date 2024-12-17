import defaultConfig from './defaultConfig';

export default {
    ...defaultConfig,
    entry: ['src'],
    importCode: "import { intl } from '@tc-i18n/vue2';",
    framework: 'vue2'
}