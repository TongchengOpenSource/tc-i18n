import prettier from 'prettier';
import * as vue3Compiler from '@vue/compiler-sfc';
import Notify from 'notify';
// import * as vue2Compiler from 'compiler2';
import * as vue2Compiler from '../../plugins/vue-template-compiler/index';
import { FRAMEWORK, SOURCE_TYPE } from 'src/constant';
import type { Tci18nConfig } from 'types';
import ParseHTML from './parseHTML';
import type * as ParseHTMLType from './parseHTML';
import ParseJS from './parseJS';
import type * as ParseJSType from './parseJS';

interface ParseTabType {
    parseSFC: (sfc: vue3Compiler.SFCDescriptor) => void;
    parseCode: (sourceCode: string) => string;
    parseTemplate: (template: vue3Compiler.SFCTemplateBlock) => void;
    parseScript: (script: vue3Compiler.SFCScriptBlock) => void;
}
interface ParsedTabType {
    parseCode: (code: string, sourceCode: string) => string;
    parseTemplate: (template: vue3Compiler.SFCTemplateBlock) => void;
    parseScript: (script: vue3Compiler.SFCScriptBlock) => void;
}

export type Hook = {
    parse: Notify<ParseTabType>,
    parsing: {
        template: ParseHTMLType.Hook,
        script: ParseJSType.Hook
    },
    parsed: Notify<ParsedTabType>,
}

let parseVUEInstance: ParseVUE;
class ParseVUE {
    config: Tci18nConfig;
    sourceType: SOURCE_TYPE;
    scene?: string;
    parseHTML: ParseHTML;
    parseJS: ParseJS;
    hooks: Hook;
    extractOnly: boolean = false;
    constructor(
        config: Tci18nConfig,
        sourceType: SOURCE_TYPE,
        scene?: string
    ) {
        this.config = config;
        this.sourceType = sourceType;
        this.scene = scene;
        this.parseHTML = new ParseHTML(this.config, this.sourceType, this.scene);
        this.parseHTML.extractOnly = this.extractOnly;
        this.parseJS = new ParseJS(this.config, this.sourceType, this.scene);
        this.parseJS.extractOnly = this.extractOnly;
        this.hooks = {
            parse: new Notify(),
            parsing: {
                template: this.parseHTML.hooks,
                script: this.parseJS.hooks
            },
            parsed: new Notify(),
        }
    }

    get hasChange() {
        return this.parseHTML.hasChange || this.parseJS.hasChange;
    }

    get primaryLocale() {
        return {
            ...this.parseHTML.primaryLocale,
            ...this.parseJS.primaryLocale,
        }
    }

    static getInstance(config: Tci18nConfig, sourceType: SOURCE_TYPE, scene?: string) {
        if (!parseVUEInstance) {
            parseVUEInstance = new ParseVUE(config, sourceType, scene);
        }
        return parseVUEInstance;
    }

    parseCode(sourceCode: string, scene?: string, prettierOptions = {}) {
        scene && (this.scene = scene);
        const { framework } = this.config;
        const _sourceCode = this.hooks.parse.callByNameAsFlow('parseCode', sourceCode);
        let sfc: any = null;
        if (framework === FRAMEWORK.VUE2) {
            sfc = vue2Compiler.parseComponent(
                _sourceCode,
                {
                    pad: 'space',
                    deindent: false
                }
            );
        } else if (framework === FRAMEWORK.VUE3) {
            const { descriptor } = vue3Compiler.parse(_sourceCode);
            sfc = {
                ...descriptor
            };
        }
        if (sfc) {
            this.hooks.parse.callByName('parseSFC', sfc);
            const { template, script, scriptSetup, styles, customBlocks } = sfc as vue3Compiler.SFCDescriptor;

            const scriptSFC = script || scriptSetup;
            const isTS = scriptSFC?.lang?.toLocaleLowerCase().startsWith('ts') || false;
            this.parseJS.isTS = isTS;
            this.parseHTML.isTS = isTS;

            let newTemplateCode = template?.content || '';
            let newScriptCode = scriptSFC?.content || '';
            if (template) {
                // 解析template
                this.hooks.parse.callByName('parseTemplate', template);
                newTemplateCode = this.parseTemplate(template);
                this.hooks.parsed.callByName('parseTemplate', template);
            }
            if (scriptSFC) {
                // 解析script
                this.hooks.parse.callByName('parseScript', scriptSFC);
                newScriptCode = this.parseScript(scriptSFC);
                this.hooks.parsed.callByName('parseScript', scriptSFC);
            }
            
            let code = sourceCode;
            if (this.hasChange) {
                code = this.combineVue(
                template ? {
                    ...template,
                    content: newTemplateCode
                } : null,
                scriptSFC ? {
                    ...scriptSFC,
                    content: newScriptCode
                } : null, styles, customBlocks);
            }

            code = this.hooks.parsed.callByNameAsFlow('parseCode', code, sourceCode);

            if (prettierOptions && Object.keys(prettierOptions).length) {
                code = prettier.format(code, {
                    parser: 'vue',
                    ...prettierOptions,
                })
            }

            return code;
        }
    }

    parseTemplate(template: vue3Compiler.SFCTemplateBlock) {
        const type = template.lang?.toLocaleLowerCase();
        if ((type || 'html') === SOURCE_TYPE.HTML) {
            // 解析html
            const newHtml = this.parseHTML.parseCode(template.content, this.scene);
            // template.content = newHtml;
            return newHtml;
        } else {
            console.warn(`暂不支持解析 ${type} 格式, 忽略template解析`);
        }
        return template.content;
    }

    parseScript(script: vue3Compiler.SFCScriptBlock) {
        const newCode = this.parseJS.parseCode(script.content.trim(), this.scene);
        // script.content = newCode;
        return newCode;
    }

    combineVue(
        template: vue3Compiler.SFCTemplateBlock | null = null,
        script: vue3Compiler.SFCScriptBlock | null = null,
        styles: vue3Compiler.SFCStyleBlock[] = [],
        customBlocks: vue3Compiler.SFCBlock[] = [],
    ) {
        return [template, script, ...styles, ...customBlocks]
            .filter(sfc => !!sfc)
            .map(sfc => `${this.openTag(sfc!)}\n${sfc!.content.trim()}\n${this.closeTag(sfc!)}\n`)
            .join('\n');
    }

    openTag(sfcBlock: vue3Compiler.SFCTemplateBlock | vue3Compiler.SFCScriptBlock | vue3Compiler.SFCStyleBlock | vue3Compiler.SFCBlock) {
        let scoped: boolean = false;
        let module: string | boolean = false;
        const { type, lang, src, attrs } = sfcBlock;
        if ('scoped' in sfcBlock && sfcBlock.type === 'style') {
            scoped = sfcBlock.scoped || false;
            module = sfcBlock.module || false;
        }
        let tag = `<${type}`;
        if (lang) tag += ` lang="${lang}"`;
        if (src) tag += ` src="${src}"`;
        if (scoped) tag += ' scoped';
        if (module) {
            if (typeof module === 'string') tag += ` module="${module}"`;
            else tag += ' module';
        }
        for (let k in attrs) {
            if (!['type', 'lang', 'src', 'scoped', 'module'].includes(k)) {
                tag += ` ${k}="${attrs[k]}"`;
            }
        }
        tag += '>';
        return tag;
    }

    closeTag(sfcBlock: vue3Compiler.SFCBlock) {
        return '</' + sfcBlock.type + '>';
    }
}

export default ParseVUE;