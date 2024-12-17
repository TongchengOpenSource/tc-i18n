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
describe('js代码测试', () => {
    it('键名为中文变量时候，提取成功', async () => {
        const code = `const obj = {
    黄家兴: 'Huang Jiaxing',
}`;
        const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.JS);
        assert.ok(newCode.includes(`[intl.$t("黄家兴")]: 'Huang Jiaxing'`));
    });
});
