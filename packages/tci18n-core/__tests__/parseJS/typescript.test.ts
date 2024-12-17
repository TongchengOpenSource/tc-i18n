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
    importCode: "import { intl } from '@tc-i18n/vue2'",
    i18nMethod: '$t',
    i18nObject: 'intl',
    framework: FRAMEWORK.VUE2,
}

const transformer = new Transformer(tci18nConfig);
describe('ts代码测试', () => {
    it('自动注入import代码', async () => {
        const code = fs.readFileSync(path.resolve(__dirname, './test.ts'), 'utf-8');
        const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.TS, 'test.ts');
        assert.ok(newCode.includes("@tc-i18n/vue2"));
    });
});
