import defaultConfig from './defaultConfig';

export default {
    ...defaultConfig,
    entry: ['src'],
    importCode: "import { intl } from '@tc-i18n/vue3';",
    framework: 'vue3'
}