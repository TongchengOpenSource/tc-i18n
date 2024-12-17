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

class VueTemplateVmPlugin implements tci18nPlugin.Plugin{
    // name: string = 'vm-to-html-plugin';
    tci18nConfig?: tci18nPlugin.Config;
    parentName: string = 'window';
    sourceTypeScope: tci18nPlugin.Plugin["sourceTypeScope"];
    constructor(options?: { 
        sourceTypeScope?: tci18nPlugin.Plugin["sourceTypeScope"]
    }) {
        if (options?.sourceTypeScope) {
            this.sourceTypeScope = (options?.sourceTypeScope || []);
        } else {
            this.sourceTypeScope = ({ sourceType, code }: tci18nPlugin.PluginOptions) => {
                if (sourceType === 'vm') {
                    if (code.includes('<!DOCTYPE html>')) {
                        // html
                        return {
                            vm: SOURCE_TYPE.HTML
                        }
                    }
                    return {
                        vm: SOURCE_TYPE.VUE
                    }
                }
            }
        }
    }
    apply(transformer: tci18nPlugin.Transformer, options: tci18nPlugin.PluginOptions) {
        this.tci18nConfig = options.config;
        transformer.transforming.tap('transformCode', (hooks) => {
            hooks.parseVUE.parsing.template.parse.tap('ignoreLines', (lines) => {
                return this.ignoreLines(lines);
            });
            hooks.parseHTML.parse.tap('ignoreLines', (lines) => {
                return this.ignoreLines(lines);
            });
            hooks.parseVUE.parse.tap('parseCode', (sourceCode) => {
                return '<template>\n' + sourceCode + '\n</template>'
            });
            hooks.parseVUE.parse.tap('parseSFC', (sfc) => {
                sfc.script = null;
            });
            hooks.parseVUE.parsed.tap('parseCode', (code, sourceCode) => {
                const line = code.trim().split('\n');
                if (line[0] === '<template>' && line[line.length - 1] === '</template>') {
                    return line.slice(1, line.length - 1).join('\n');
                }
                return sourceCode
            });
        });
    }

    ignoreLines(lines: string[]) {
        let ignores: number[] = [];
        let startLine = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('##')) ignores.push(i + 1);
            if (startLine === -1 && lines[i].includes('#*')) startLine = i;
            if (lines[i].includes('*#')) {
                ignores.push(i)
                startLine = -1;
            }
            if (startLine > -1) {
                ignores.push(i + 1);
            }
        }
        return ignores;
    }
};

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
            })
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
describe('插件测试', () => {
    it.skip('vm文件解析插件', async () => {
        const vueTemplateVmPlugin = new VueTemplateVmPlugin();
        const injectI18nPlugin = new InjectI18nPlugin({
            sourceTypeScope: ['js']
        });
        tci18nConfig.plugins = [vueTemplateVmPlugin, injectI18nPlugin];
        const transformer = new Transformer({
            ...tci18nConfig,
            plugins: [vueTemplateVmPlugin, injectI18nPlugin]
        });
        const code = fs.readFileSync(path.join(__dirname, './vm/vm.vm'), 'utf-8');
        const { code: newCode} = await transformer.transformCode(code, 'vm', 'vm.vm');
        fs.writeFileSync(path.join(__dirname, './vm/vm-new.vm'), newCode);
        assert.ok(newCode.includes(`{{$t('退改规(对客)#!!!#vm.vm_1')}}`));
        assert.ok(newCode.includes(`{{$t('邮寄信息#!!!#vm.vm_1')}}`));
    });
    it('vm支持解析html内容和单组件内容', async () => {
        const vueTemplateVmPlugin = new VueTemplateVmPlugin();
        const transformer = new Transformer({
            ...tci18nConfig,
            plugins: [vueTemplateVmPlugin]
        });
        // const htmlVM = fs.readFileSync(path.join(__dirname, './vm/html.vm'), 'utf-8');
        // const { code: newHTMLVM} = await transformer.transformCode(htmlVM, 'vm', 'vm.vm');
        // fs.writeFileSync(path.join(__dirname, './vm/new-html.vm'), newHTMLVM);
        const componentVM = fs.readFileSync(path.join(__dirname, './vm/edit.vm'), 'utf-8');
        const { code: newComponentVM} = await transformer.transformCode(componentVM, 'vm', 'vm.vm');
        fs.writeFileSync(path.join(__dirname, './vm/new-component.vm'), newComponentVM);
        assert.ok(true);
    });
});
