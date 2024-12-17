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
    it('自动注入i18n属性插件', async () => {
        class InjectI18nPlugin implements tci18nPlugin.Plugin{
            tci18nConfig?: tci18nPlugin.Config;
            parentName: string = 'window';
            sourceTypeScope = ['html', 'js'];
            constructor(options?: { 
                parentName?: string,
                sourceTypeScope?: string[]
            }) {
                if (options && options.parentName) {
                    this.parentName = options.parentName;
                }
                this.sourceTypeScope = [...this.sourceTypeScope, ...(options?.sourceTypeScope || [])];
            }
            apply(transformer: tci18nPlugin.Transformer, options: tci18nPlugin.PluginOptions) {
                this.tci18nConfig = options.config;
                transformer.transforming.tap('transformCode', (hooks) => {
                    hooks.parseJS.parsing.tap('ObjectExpression', (path, t) => {
                        return this.isNewVue(path, t);
                    });
                    hooks.parseHTML.parsing.parseJS.parsing.tap('ObjectExpression', (path, t) => {
                        return this.isNewVue(path, t);
                    });
                });
            }
            isNewVue(path: babel.NodePath<babel.types.ObjectExpression>,  t: tci18nPlugin.BabelT) {
                if (!this.tci18nConfig) {
                    return;
                }
                const { framework, importCode } = this.tci18nConfig;
                if (
                    path.parent.type === 'NewExpression'
                    && path.parent.callee.type === 'Identifier'
                    && path.parent.callee.name === 'Vue'
                ) {
                    const i18nProp = path.node.properties.find((prop) => {
                        if ('key' in prop && 'name' in prop.key) {
                            return prop.key.name === 'i18n';
                        }
                        return false;
                    });
                    if (!i18nProp && framework === 'vue2' && !importCode) {
                        this.injectI18nProp(path, t);
                        return {
                            HAS_CHANGE: true,
                        }
                    }
                }
            }
            injectI18nProp(path: babel.NodePath<babel.types.ObjectExpression>, t: tci18nPlugin.BabelT) {
                path.node.properties.unshift(
                    t.objectProperty(
                        t.identifier('i18n'),
                        t.callExpression(
                            t.memberExpression(
                                t.memberExpression(
                                    t.identifier(this.parentName),
                                    t.identifier('tci18n'),
                                ),
                                t.identifier('tci18nVueI18n')
                            ),
                            [
                                t.objectExpression([
                                    t.objectProperty(
                                        t.identifier('locale'),
                                        t.memberExpression(
                                            t.identifier(this.parentName),
                                            t.identifier('__tci18n_locale__'),
                                        )
                                    ),
                                    t.objectProperty(
                                        t.identifier('langs'),
                                        t.memberExpression(
                                            t.identifier(this.parentName),
                                            t.identifier('__tci18n_langs__'),
                                        )
                                    )
                                ]),
                                t.identifier('Vue')
                            ]
                        )
                    )
                )
            }
        };
        const transformPlugin = new InjectI18nPlugin({
            sourceTypeScope: ['ftl:html']
        });
        const transformVmPlugin = new InjectI18nPlugin({
            sourceTypeScope: ['vm:vue', 'js']
        });
        tci18nConfig.plugins = [transformPlugin];
        const transformer = new Transformer(tci18nConfig);
        // const code = fs.readFileSync(path.join(__dirname, './injecti18n.js'), 'utf-8');
        const code = fs.readFileSync(path.join(__dirname, './ftl.ftl'), 'utf-8');
        const { code: newCode} = await transformer.transformCode(code, 'ftl', 'ftl.ftl');
        fs.writeFileSync(path.join(__dirname, './ftl-new.ftl'), newCode);
        assert.ok(newCode.includes('window.tci18n.tci18nVueI18n({ locale: window.__tci18n_locale__, langs: window.__tci18n_langs__ }'));
    })
});
