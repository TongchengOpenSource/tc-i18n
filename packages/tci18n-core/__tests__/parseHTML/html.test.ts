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
    framework: FRAMEWORK.VUE2,
}

const transformer = new Transformer(tci18nConfig);
describe('html代码测试', () => {
    describe('html标签测试', () => {
        it('解析html', async () => {
            const code = `
    <div>
    <!-- 123 -->
        <div class="name">123</div>
    </div>
    <script>
    // 123
    </script>
    `;
            const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.HTML, 'test.html');
        });
        it('解析template标签', async () => {
            const code = `
    <div>
        <template>
            <div class="name">你好</div>
        </template>
    </div>
    `;
            const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.HTML, 'test1.html');
            assert.ok(newCode.includes(`{{$t('你好#!!!#test1.html_1')}}`));
        });
    });
    describe('标签属性测试', () => {
        it('解析静态属性', async () => {
            const code = `<input placeholder="请输入"/>`;
            const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.HTML, 'test2.html');
            assert.ok(newCode.includes(`<input :placeholder="$t('请输入#!!!#test2.html_1`))
        });
        it('解析动态属性', async () => {
            const code = `
            <input :placeholder="\`请输入\`" />
            `;
            const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.HTML, 'test3.html');
            assert.ok(newCode.includes('<input :placeholder="$t(`请输入#!!!#test3.html_1'))
        });
        it('解析模板字符串的动态属性', async () => {
            const code = `<input :placeholder="'请输入'"/>`;
            const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.HTML, 'test4.html');
            assert.ok(newCode.includes(`<input :placeholder="$t('请输入#!!!#test4.html_1`))
        });
        it('placeholder中有代码', async () => {
            const code = `<input placeholder="const a = '测试';" />`;
            const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.HTML, 'test5.html');
            assert.ok(newCode.includes(`<input :placeholder="$t('const a = \\'测试\\';#!!!#test5.html_1')"/>`))
        });
        it('属性中是数组', async () => {
            const code = `<div :titles="['你好', '中国']"></div>`;
            const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.HTML, 'test6.html');
            assert.ok(newCode.includes(`:titles="[$t('你好#!!!#test6.html_1'), $t('中国#!!!#test6.html_1')]"`));
        });
    });
    describe('标签属性制表符测试', () => {
        it('解析属性中的\n', async () => {
            const code = `<template><input placeholder="你好\n" /></template>`;
            const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.VUE, 'test7.vue');
            assert.ok(newCode.includes(`<input :placeholder="$t('你好#!!!#test7.vue_1')"/>`))
        });
        it('解析属性中的\\n', async () => {
            const code = `<template><input placeholder="你好2\\n" /></template>`;
            const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.VUE, 'test8.vue');
            assert.ok(newCode.includes(`<input :placeholder="$t('你好2\\n#!!!#test8.vue_1')"/>`))
        });
    });
    describe('标签属性引号测试', () => {
        it('解析属性中的单引号', async () => {
            const code = `<div name="'中国'"></div>`;
            const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.HTML, 'test9.html');
            assert.ok(newCode.includes(`<div :name="$t('\\'中国\\'#!!!#test9.html_1')"></div>`))
        });
        it('解析属性中的双引号', async () => {
            const code = `<div name='"中国"'></div>`;
            const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.HTML, 'test10.html');
            assert.ok(newCode.includes(`<div :name="$t('\\"中国\\"#!!!#test10.html_1')"></div>`))
        });
    });
    describe.skip('自动注入data-tci18n属性', () => {
        it('存在data-tci18n属性', async () => {
            const code = `<template><div>黄家兴</div></template>`;
            const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.VUE, 'test11.vue');
            assert.ok(newCode.includes(`data-tci18n`));
            assert.ok(newCode.includes(`data-tci18n-key`));
        });
        it('解析自定义替换函数', async () => {
            const code = `<template><div>{{ $t('common.title') }}</div></template>`;
            const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.VUE, 'test12.vue');
            assert.ok(newCode.includes(`data-tci18n`));
            assert.ok(newCode.includes(`data-tci18n-key="['common.title']"`));
        });
    });
    it('代码中有&nbsp;，不提取&nbsp;', async () => {
        const transformer = new Transformer({
            ...tci18nConfig,
            extractOnly: false,
        });
        const code = '<div>&nbsp;&nbsp;你好</div>';
        const { code: newCode, hasError } = await transformer.transformCode(code, SOURCE_TYPE.HTML, 'test13.html');
        assert.ok(newCode.includes("<div>&nbsp;&nbsp;{{$t('你好#!!!#test13.html_1')}}</div>"));
    });
    it('测试业务html解析', async () => {
        const transformer = new Transformer({
            ...tci18nConfig,
            extractOnly: false,
        });
        const code = fs.readFileSync(path.resolve(__dirname, './test.html'), 'utf-8');
        const { code: newCode, hasError } = await transformer.transformCode(code, SOURCE_TYPE.HTML, 'test14.html');
        assert.ok(!hasError);
    });
});
