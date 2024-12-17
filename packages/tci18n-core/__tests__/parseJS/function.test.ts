import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { SOURCE_TYPE, FRAMEWORK } from '../../src/constant/common';
import Transformer from '../../src/index';
import type { Tci18nConfig } from '../../types';

const tci18nConfig: Tci18nConfig = {
    entry: [],
    exclude: [],
    keyHasScene: false,
    extractOnly: false,
    ignoreComponents: [],
    ignoreMethods: [],
    ignoreAttrs: ['style'],
    ignoreStrings: [],
    importCode: "import { intl } from 'tci18n-vue2'",
    i18nMethod: '$t',
    i18nObject: 'intl',
    framework: FRAMEWORK.VUE2,
}

const transformer = new Transformer(tci18nConfig);
describe('function代码测试', () => {
    it('替换函数不动', async () => {
        const code = `
const method = intl.$t('中国');
`;
        const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.JS);
        assert.ok(newCode?.includes(`const method = intl.$t('中国');`));
    });
    it('提取替换函数中的值', async () => {
        const code = `
const method = intl.$t('中国');
`;
        tci18nConfig.keyHasScene = true;
        const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.JS, 'test.js');
        assert.ok('中国' in transformer.primaryLocaleData);
    });
});
