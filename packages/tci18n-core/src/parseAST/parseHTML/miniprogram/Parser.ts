import Hogan from 'hogan.js';
import prettier from 'prettier';
import * as t from '@babel/types';
import { FRAMEWORK, SOURCE_TYPE } from 'src/constant';
import type { Tci18nConfig } from 'types';
import BaseParse from '../../BaseParse';
import { Hook} from '../index';
import ParseJS from '../../parseJS';

class MiniprogramParser extends BaseParse {
    config: Tci18nConfig;
    sourceType: SOURCE_TYPE;
    scene?: string;
    parseJS?: ParseJS;
    hasChange: boolean = false;
    hasWsx: boolean = false;
    WXML_LANGS_NAME = 'LANGS';
    WXML_LOCALE_NAME = 'LOCALE';
    WXS_LOCALE_NAME = 'LOCALE';
    wxsModules: string[] = [];
    wxsModuleIndex = 0;
    extractOnly: boolean = false;
    constructor(config: Tci18nConfig, sourceType: SOURCE_TYPE, scene?: string) {
        super(config, sourceType, scene);
        this.config = { ...config };
        this.sourceType = sourceType;
        this.scene = scene;
    }

    get primaryLocale() {
        return {
            ...this.primaryLocaleData,
            ...this.parseJS?.primaryLocale
        };
    }


    get parseJSInstance() {
        if (!this.parseJS) {
            this.parseJS = new ParseJS(this.config, this.sourceType, this.scene);
            this.parseJS.needImport = false;
            this.parseJS.config.i18nMethod = 't';
            this.parseJS.hooks.parsing.tap('makeI18nFunction', (args) => {
                args.push(t.identifier(this.WXML_LOCALE_NAME));
            });
        }
        return this.parseJS;
    }

    load(hook: Hook, extractOnly?: boolean) {
        this.extractOnly = extractOnly || false;
        const { framework } = this.config;
        if (![FRAMEWORK.MINIPROGRAM].includes(framework)) {
            return;
        }
        hook.parse.tap('parseCode', this.parseCodeInParse.bind(this));
        hook.parsing.parseHTML.tap('parseAttr', this.parseAttr.bind(this));
        hook.parsing.parseHTML.tap('parseAttrs', this.parseAttrs.bind(this));
        hook.parsing.parseHTML.tap('parseInnerText', this.parseInnerText.bind(this));
        hook.parsed.tap('parseCode', this.parseCodeInParsed.bind(this));
    }

    /**
     * 解析前处理代码
     * @param node 
     */
    parseCodeInParse(node: parse5.ParseRootNode) {
        const html = node.childNodes.find(nd => nd.tagName === 'html');
        if (html) {
            const body = html.childNodes.find(nd => nd.tagName === 'body') as parse5.ParseBodyNode;
            if (body) {
                if (this.sourceType === SOURCE_TYPE.WXML && body.childNodes.length) {
                    const firstNode = body.childNodes[0];
                    if ('attrs' in firstNode
                        && firstNode.tagName === 'wxs'
                        && firstNode.attrs.find((attr) => (attr.name === 'module' && attr.value === 'intl'))
                    ) {
                        // 说明没有引入wxs模块，需要引入
                        this.hasWsx = true;
                    }
                }
            }
        }
    }

    /**
     * 解析后处理代码
     * @param code 
     * @returns 
     */
    parseCodeInParsed(code: string) {
        let insertCode = '';
        const spanInject = (fn: string) => {
            return `<span style="display: none;" injectData="{{${fn}}}"></span>`;
        }
        if (!this.hasWsx && this.hasChange && this.scene) {
            const relativePath = this.formatPath(this.relativePath(this.dirnamePath(this.scene), 'tci18n.wxs'));
            insertCode += `<wxs module="intl" src="${relativePath}"></wxs>\n${spanInject(`intl.setLangs(${this.WXML_LANGS_NAME})`)}`;
        }
        if (this.wxsModules.length) {
            insertCode += this.wxsModules.map((name) => spanInject(`${name}.setLocale(${this.WXML_LOCALE_NAME})`)).join('\n');
        }

        return !this.extractOnly && insertCode ? `${insertCode}\n${code}` : code;
    }

    parseAttrs(node: parse5.ParseTagNode) {
        if (node.tagName === 'wxs') {
            const moduleAttr = node.attrs.find((attr) => attr.name === 'module');
            if (moduleAttr) {
                this.wxsModules.push(moduleAttr.value);
            } else {
                const value = `tci18nModule${++this.wxsModuleIndex}`;
                if (!this.extractOnly) {
                    node.attrs.push({
                        name: 'module',
                        value,
                    });
                }
                this.wxsModules.push(value);
            }
        }
    }

    parseAttr(node: parse5.ParseTagNode, attr: parse5.ParseAttribute) {
        if (this.sourceType === SOURCE_TYPE.WXML) {
            return this.parseWxmlAttr(attr, node);
        }
        this.hasChange = this.parseJSInstance.hasChange;
        return {
            HAS_CHANGE: this.parseJSInstance.hasChange,
            SKIP: true,
        }
    }

    parseWxmlAttr(attr: parse5.ParseAttribute, node: parse5.ParseTagNode) {
        const value = attr.value.trim();
        if (!this.isPrimary(value, 'parseWxmlAttr')) {
            return;
        }
        const tokens = this.parseStrByHogan(value);
        let newValue = '';
        let hasChange = false;
        for (const token of tokens) {
            if (token.tag === '_t') {
                if (this.isPrimary(token.text, 'parseWxmlAttr')) {
                    const code = `intl.t('${this.makeKey(attr.value, true)}', ${this.WXML_LOCALE_NAME})`;
                    // const code = this.parseAsJs(token.text);
                    newValue += `{{${code}}}`;
                    hasChange = true;
                } else {
                    newValue += token.text;
                }
            } else if (token.tag === '_v') {
                const code = this.parseAsJs(token.n);
                hasChange = hasChange || this.parseJSInstance.hasChange;
                newValue = `{{${code}}}`;
            }
        }
        if (!this.extractOnly) {
            attr.value = newValue;
        }
        return {
            HAS_CHANGE: hasChange,
            SKIP: true,
        }
    }

    parseInnerText(node: parse5.ParseTextNode) {
        const tagName = node.parentNode && node.parentNode.tagName;
        if (tagName === 'wxs') {
            return this.parseInnerTextInWxs(node);
        }
        const tokens = this.parseStrByHogan(node.value);
        let newValue = '';
        for (const token of tokens) {
            if (token.tag === '_t') {
                if (this.isPrimary(token.text, 'parseInnerText')) {
                    const code = `intl.t('${this.makeKey(token.text, true)}', ${this.WXML_LOCALE_NAME})`;
                    // const code = this.parseAsJs(`'${this.formatKey(token.text)}'`);
                    newValue += `{{${code}}}`;
                } else {
                    newValue += token.text
                }
            } else if (token.tag === '_v') {
                if (this.isPrimary(token.n, 'parseInnerText')) {
                    let source = this.parseAsJs(token.n);
                    newValue += `{{${source}}}`;
                } else {
                    newValue += `{{${token.n}}}`;
                }
            }
        }
        if (node.value !== newValue) {
            if (!this.extractOnly) {
                node.value = newValue;
            }
            this.hasChange = true;
            return {
                SKIP: true,
                HAS_CHANGE: true,
            }
        }
        return {
            SKIP: true,
        }
    }

    parseInnerTextInWxs(node: parse5.ParseTextNode) {
        if (this.scene) {
            // const oldImportCode = this.parseJSInstance.config.importCode;
            const relativePath = this.formatPath(this.relativePath(this.dirnamePath(this.scene), 'tci18n.wxs'));
            // 不应该直接修改config的值
    //         this.parseJSInstance.config.importCode = `var intl = require("${relativePath}");
    // var locale;
    // function setLocale(lo) {locale = lo};
    // module.exports.setLocale = setLocale;`
            const cancelTab = this.parseJSInstance.hooks.parsed.tap('parseCode', (code: string) => {
                    return `var intl = require("${relativePath}");
var locale;
function setLocale(lo) {locale = lo};
module.exports.setLocale = setLocale;
${code}`;
            });
            const newCode = this.parseAsJs(node.value);
            cancelTab();
            // this.parseJSInstance.config.importCode = oldImportCode;
            if (node.value !== newCode) {
                if (!this.extractOnly) {
                    node.value = newCode;
                }
                this.hasChange = true;
                return {
                    SKIP: true,
                    HAS_CHANGE: true,
                }
            }
        }
        return {
            SKIP: true,
        }
    }

    parseNode(node: parse5.ParseChildNode) {
        if (node.nodeName === 'wxs') {
            return this.parseWxsNode(node);
        }
    }

    parseWxsNode(node: parse5.ParseTagNode) {
        const moduleAttr = node.attrs.find((attr) => attr.name === 'module');
        if (moduleAttr) {
            this.wxsModules.push(moduleAttr.value);
        } else {
            const value = `tci18nModule${++this.wxsModuleIndex}`;
            if (!this.extractOnly) {
                node.attrs.push({
                    name: 'module',
                    value,
                });
            }
            this.wxsModules.push(value);
        }
    }

    parseAsJs(code: string) {
        const newCode = this.parseJSInstance.parseCode(code, this.scene);
        return prettier.format(newCode, {
            parser: 'babel',
            singleQuote: true,
            semi: false,
            printWidth: 10000000,
        }).replace(/\s*$/, '');
    }

    parseStrByHogan(str: string) {
        delete Hogan.tags['{'];
        delete Hogan.tags['$'];
        const tokens = Hogan.scan(str);
        Hogan.tags['{'] = 10;
        Hogan.tags['$'] = 4;
        return tokens
    }
}

export default MiniprogramParser;