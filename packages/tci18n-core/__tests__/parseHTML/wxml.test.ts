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
describe('wxml代码测试', () => {
    describe('wxml属性和innerText测试', () => {
        it('解析wxml属性', async () => {
            const code = `<input placeholder="请输入"/>`;
            const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.WXML, 'test.wxml');
            assert.ok(newCode.includes(`<input placeholder="{{intl.t('请输入#!!!#test.wxml_1', LOCALE)}}"/>`))
        });
        it('解析wxml的innerText', async () => {
            const code = `<view>你好</view>`;
            const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.WXML, 'test.wxml');
            assert.ok(newCode.includes(`<view>{{intl.t('你好#!!!#test.wxml_1', LOCALE)}}</view>`));
        });
    });
    describe('wxs标签', () => {
        it('解析wxml里面的wxs标签内容', async () => {
            const code = `
            <wxs>
                var name = "黄家兴";
            </wxs>`;
            const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.WXML, 'test.wxml');
            const result = `<wxs module="intl" src="tci18n.wxs"></wxs>
<span style="display: none;" injectData="{{intl.setLangs(LANGS)}}"></span><span style="display: none;" injectData="{{tci18nModule1.setLocale(LOCALE)}}"></span>
<wxs module="tci18nModule1">var intl = require('tci18n.wxs')
var locale
function setLocale(lo) {
  locale = lo
}
module.exports.setLocale = setLocale

var name = intl.t('黄家兴#!!!#test.wxml_1', LOCALE)</wxs>`
            assert.equal(newCode, result);
        });
        it('不解析wxml里面的wxs标签内容', async () => {
            const code = '<wxs src="./test.wxs"></wxs>';
            const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.WXML, 'test.wxml');
            assert.ok(newCode === '<wxs src="./test.wxs"></wxs>');
        })
    });
});
