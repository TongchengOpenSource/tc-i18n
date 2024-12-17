import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { SOURCE_TYPE, FRAMEWORK } from '../../src/constant/common';
import Transformer from '../../src/index';
import type { Tci18nConfig } from '../../types';

const tci18nConfig: Tci18nConfig = {
    entry: [],
    exclude: [],
    keyHasScene: true,
    extractOnly: false,
    ignoreComponents: [],
    ignoreMethods: [],
    ignoreAttrs: ['style'],
    ignoreStrings: [],
    importCode: "import { intl } from 'tci18n-vue2'",
    i18nMethod: '$t',
    i18nObject: 'intl',
    framework: FRAMEWORK.MINIPROGRAM,
}

const transformer = new Transformer(tci18nConfig);



describe('小程序代码测试', () => {
    it('自动引入Tci18nPage', async () => {
        const code = `
Page({
    data: {
        name: '黄家兴',
    },
    onLoad: async function (options) {},
})`;
        const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.JS, 'test.js');
        const hasImport = newCode?.includes('@tc-i18n/miniprogram');
        const hasTci18nPage = newCode?.includes('Tci18nPage');
        assert.ok(hasImport && hasTci18nPage);
    });

    it('自动引入Tci18nComponent', async () => {
        const code = `
Component({
    data: {
        name: '黄家兴',
    },
    onLoad: async function (options) {},
})`;
        const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.JS, 'test.js');
        const hasImport = newCode?.includes('@tc-i18n/miniprogram');
        const hasTci18nComponent = newCode?.includes('Tci18nComponent');
        assert.ok(hasImport && hasTci18nComponent);
    });
});
