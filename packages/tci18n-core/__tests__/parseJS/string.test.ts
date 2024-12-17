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
describe('string代码测试', () => {
    it('替换模板字符串', async () => {
        const code = `
const obj = \`我的名字是\$\{name\}\`;
`;
        const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.JS);
        assert.ok(newCode?.includes('intl.$t(`我的名字是{name}`, { "name": name });'));
    });
    it('重复字符串', async () => {
        const code = `
'use client'
import { intl } from 'tci18n-vue2';
const name1 = '中国';
const name2 = '中国2';
`;
        tci18nConfig.keyHasScene = true;
        const transformer = new Transformer(tci18nConfig);
        const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.JS, 'test.js');
        assert.ok(
            newCode?.includes('中国#!!!#test.js_1')
            && newCode?.includes('中国2#!!!#test.js_1')
        );
    });
    describe('测试ignoreAST', () => {
        it('忽略switchCase中的中文', async () => {
            const code = `
            switch(key) {
                case '你好': break;
            }
            `;
            const transformer = new Transformer({
                ...tci18nConfig,
                ignoreAST: {
                    SwitchCase: true,
                }
            });
            const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.JS);
            assert.ok(newCode?.includes("case '你好'"));
        });
        it('忽略BinaryExpression中的中文', async () => {
            const code = `
            if ('你好' === '中国') {}
            `;
            const transformer = new Transformer({
                ...tci18nConfig,
                ignoreAST: {
                    BinaryExpression: true,
                }
            });
            const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.JS);
            assert.ok(newCode?.includes(`'你好' === '中国'`));
        });
        it('忽略BinaryExpression中的左侧', async () => {
            const code = `
            if ('你好' === '中国') {}
            `;
            const transformer = new Transformer({
                ...tci18nConfig,
                ignoreAST: {
                    BinaryExpression: {
                        left: ['你好'],
                    },
                }
            });
            const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.JS);
            assert.ok(newCode?.includes(`'你好' === intl.$t("中国")`));
        });
        it('忽略BinaryExpression中的右侧', async () => {
            const code = `
            if ('你好' === '中国') {}
            `;
            const transformer = new Transformer({
                ...tci18nConfig,
                ignoreAST: {
                    BinaryExpression: {
                        left: ['你好'],
                        right: ['中国'],
                    },
                }
            });
            const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.JS);
            assert.ok(newCode?.includes(`'你好' === '中国'`));
        });
        it('忽略MemberExpression中的中文', async () => {
            const code = `
            obj['你好'];
            `;
            const transformer = new Transformer({
                ...tci18nConfig,
                ignoreAST: {
                    MemberExpression: true,
                }
            });
            const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.JS);
            assert.ok(newCode?.includes(`obj['你好'];`));
        });
    })
});
