import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { SOURCE_TYPE, FRAMEWORK } from '../../src/constant/common';
import Transformer from '../../src/index';

const tci18nConfig: tci18nPlugin.Config = {
    entry: [],
    exclude: [],
    keyHasScene: true,
    extractOnly: false,
    ignoreComponents: [],
    ignoreMethods: [],
    ignoreAttrs: ['style'],
    ignoreStrings: [],
    importCode: "",
    i18nMethod: '$t',
    i18nObject: 'intl',
    framework: FRAMEWORK.VUE2,
}

describe('插件测试', () => {
    it('cshtml插件', async () => {
        class CshtmlPlugin implements tci18nPlugin.Plugin{
            tci18nConfig?: tci18nPlugin.Config;
            sourceTypeScope = ['cshtml:html'];
            replaceRegex: RegExp = /[\u4e00-\u9fa5]+/g;
            templateStr: string = '';
            constructor(options: { replaceRegex?: RegExp, templateStr: string }) {
                this.templateStr = options.templateStr;
                if (options.replaceRegex) {
                    this.replaceRegex = options.replaceRegex;
                }
            }
            apply(transformer: tci18nPlugin.Transformer, options: tci18nPlugin.PluginOptions) {
                this.tci18nConfig = options.config;
                transformer.afterTransform.tap('transformCode', (code) => {
                    const source = code.replace(this.replaceRegex, (...args) => {
                        let templateStr = this.templateStr;
                        args.forEach((arg, index) => {
                            templateStr = templateStr.replace(`{arg${index}}`, arg)
                        })
                        return templateStr
                    })
                    return source
                });
            }
        };
        const transformPlugin = new CshtmlPlugin({
            templateStr: `@I18nClient.Tran('{arg0}', LanguageEnum.EN_GB)`
        });
        tci18nConfig.plugins = [transformPlugin];
        const transformer = new Transformer(tci18nConfig);
        // const code = fs.readFileSync(path.join(__dirname, './injecti18n.js'), 'utf-8');
        const code = fs.readFileSync(path.join(__dirname, './cshtml.cshtml'), 'utf-8');
        const { code: newCode} = await transformer.transformCode(code, 'cshtml', 'cshtml.cshtml');
        fs.writeFileSync(path.join(__dirname, './cshtml-new.cshtml'), newCode);
        assert.ok(true);
    })
});
