import Hogan from 'hogan.js';
import prettier from 'prettier';
import parse5AST from 'parse5';
import Serializer from 'parse5/serializer';
import Notify from 'notify';
import { FRAMEWORK, SOURCE_TYPE } from '../../constant';
import type { Tci18nConfig, HookReturn } from 'types';
import BaseParse from '../BaseParse';
import ParseJS from '../parseJS';
import type * as ParseJSType from '../parseJS';
import VueParser from './vue/Parser';
import MiniprogramParser from './miniprogram/Parser';

interface ParseTabType {
    parseCode: (ast: parse5.ParseRootNode) => HookReturn | void;
    ignoreLines: (lines: string[]) => number[];
}

interface ParsingHTMLType {
    parseNode: (node: parse5.ParseChildNode) => HookReturn | void;
    parseAttrs: (node: parse5.ParseTagNode) => HookReturn | void;
    parseAttr: (node: parse5.ParseTagNode, attr: parse5.ParseAttribute) => HookReturn | void;
    parseInnerText: (node: parse5.ParseTextNode) => HookReturn | void;
}

interface ParsedTabType {
    parseCode: (code: string) => string;
}

export type Hook = {
    parse: Notify<ParseTabType>,
    parsing: {
        parseHTML: Notify<ParsingHTMLType>,
        parseJS: ParseJSType.Hook
    },
    parsed: Notify<ParsedTabType>,
}

let parseHTMLInstance: ParseHTML;
class ParseHTML extends BaseParse {
    config: Tci18nConfig;
    sourceType: SOURCE_TYPE;
    scene?: string;
    /**
     * 需要忽略的行，通过注释获取
     */
    ignoreLines: number[] = [];
    parseJS?: ParseJS;
    vueParser?: VueParser;
    miniprogramParser?: MiniprogramParser;
    hooks: Hook;
    onlyBody: boolean = false;
    hasChange: boolean = false;
    isTS = false;
    
    /**
     * 只提取语料，不替换源代码
     */
    extractOnly: boolean = false;

    constructor(
        config: Tci18nConfig,
        sourceType: SOURCE_TYPE,
        scene?: string,
    ) {
        super(config, sourceType, scene);
        this.config = { ...config };
        this.sourceType = sourceType;
        this.scene = scene;
        this.hooks = {
            parse: new Notify(), // 源码解析前(ast已生成)
            parsing: {
                parseHTML: new Notify(), // html解析中
                parseJS: {
                    parse: new Notify(),
                    parsing: new Notify(),
                    parsed: new Notify(),
                }, // 源码解析中
            }, // 源码解析中
            parsed: new Notify(), // 源码解析后
        };
        const { framework } = this.config;
        if ([FRAMEWORK.VUE2, FRAMEWORK.VUE3, FRAMEWORK.HTML].includes(framework)) {
            this.vueParser = new VueParser(this.config, this.sourceType, this.scene);
            this.vueParser.load(this.hooks, this.extractOnly);
        }
        if ([FRAMEWORK.MINIPROGRAM].includes(framework)) {
            this.miniprogramParser = new MiniprogramParser(this.config, this.sourceType, this.scene);
            this.miniprogramParser.load(this.hooks, this.extractOnly);
        }
    }

    get primaryLocale() {
        return {
            ...this.primaryLocaleData,
            ...this.parseJS?.primaryLocale,
            ...this.vueParser?.primaryLocale,
            ...this.miniprogramParser?.primaryLocale,
        }
    }

    get parseJSInstance() {
        if (!this.parseJS) {
            this.parseJS = new ParseJS(this.config, this.sourceType, this.scene);
            this.parseJS.isTS = this.isTS;
            this.parseJS.setHooks(this.hooks.parsing.parseJS);
            this.parseJS.needImport = false;
            this.parseJS.needI18nObject = false;
        }
        return this.parseJS;
    }

    static getInstance(config: Tci18nConfig, sourceType: SOURCE_TYPE, scene?: string) {
        if (!parseHTMLInstance) {
            parseHTMLInstance = new ParseHTML(config, sourceType, scene);
        }
        return parseHTMLInstance;
    }

    parseCode(sourceCode: string, scene?: string, prettierOptions = {}) {
        scene && (this.scene = scene);
        const ast = parse5AST.parse(sourceCode, { sourceCodeLocationInfo: true });
        this.ignoreLines = this.getIgnoreLines(sourceCode);
        this.hooks.parse.callByName<string>('parseCode', ast);
        const html = ast.childNodes.find(nd => nd.tagName === 'html');
        if (html) {
            const body = html.childNodes.find(nd => nd.tagName === 'body');
            if (body) {
                this.traverse(body);
            }
        }
        const serializer = new Serializer(ast);
        let code = serializer.serialize();
        if (!this.hasChange) {
            return sourceCode;
        }
        // 不同的框架处理方式不同，比如：html直接返回，vue返回body部分
        let bodyCode = '';
        let head = '', body = '';
        if (code.split('<head>').length > 1) {
            head = code.split('<head>')[1].split('</head>')[0];
        }
        if (code.split('<body>').length > 1) {
            body = code.split('<body>')[1].split('</body>')[0];
        }
        bodyCode = `${head ? `${head}\n` : ''}` + body;
        let returnCode = '';
        if (this.onlyBody) {
            returnCode = bodyCode;
        } else {
            switch(this.sourceType) {
                case SOURCE_TYPE.HTML: 
                    returnCode = code;
                    break;
                case SOURCE_TYPE.VUE:
                case SOURCE_TYPE.WXML: 
                    returnCode = bodyCode;
                    break;
                default: 
                    returnCode = sourceCode;
                    break;
            }
        }
        returnCode = this.hooks.parsed.callByNameAsFlow<string>('parseCode', returnCode);

        if (prettierOptions && Object.keys(prettierOptions).length) {
            returnCode = prettier.format(returnCode, {
                parser: 'html',
                tabWidth: 4,
                singleQuote: true,
                semi: true,
                ...prettierOptions,
            })
        }
    
        return returnCode;
    }

    /**
     * 获取需要忽略的行
     * @param sourceCode 
     * @returns 
     */
    getIgnoreLines(sourceCode: string) {
        let ignores: number[] = [];
        let ignoring = false;
        const lines = sourceCode.split(/\n|\r\n/g);
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('tci18n-ignore-line')) {
                ignoring = true
            };
            if (ignoring) ignores.push(i + 1);
        }
        const pluginIgnores = this.hooks.parse.callByName<number>('ignoreLines', lines)?.flat() || [];
        return [...ignores, ...pluginIgnores];
    }

    /**
     * 判断当前节点元素是否需要忽略
     * @param node 当前解析的节点元素
     * @returns 
     */
    shouldIgnore(node: parse5.ParseNode) {
        if (!node.sourceCodeLocation) {
            return false;
        }
        const sourceCodeLocation = node.sourceCodeLocation;
        return this.ignoreLines.some((line) => {
            const { startLine, endLine } = sourceCodeLocation;
            return line === startLine || line === endLine;
        });
    }

    /**
     * 代码解析过程中，统一处理的插件钩子
     * @param type 钩子函数类型
     * @param args 需要传递的参数
     * @returns 
     */
    visitorHookSkip(type: string, node: parse5.ParseChildNode, ...args: any[]) {
        const params = this.hooks.parsing.parseHTML.callByName<HookReturn>(type, node, ...args);
        let hasSkip = false;
        let hasChange = false;
        if (params) {
            hasSkip = params.some((param) => 'SKIP' in param && param.SKIP);
            hasChange = params.some((param) => 'HAS_CHANGE' in param && param.HAS_CHANGE);
            this.hasChange = this.hasChange || hasChange;
        }
        return hasSkip;
    }

    /**
     * 递归函数，解析html
     * @param node 
     * @returns 
     */
    traverse(node: parse5.ParseChildNode) {
        if (this.ignoreComponents(node.nodeName)) {
            return;
        }

        // script标签里面的内容按照js处理
        if (
            node.nodeName === 'script'
            && node.childNodes.length
        ) {
            const childNode = node.childNodes[0] as parse5.ParseTextNode;
            if (childNode.nodeName === '#text') {
                const newCode = this.parseJSInstance.parseCode(childNode.value, this.scene);
                if (this.parseJSInstance.hasChange) {
                    this.hasChange = this.parseJSInstance.hasChange;
                    childNode.value = newCode;
                }
            }
            return;
        }
        if ('childNodes' in node && node.childNodes && node.childNodes.length) {
            node.childNodes.forEach((childNode) => this.traverse(childNode));
        }
        if ('content' in node && node.nodeName === 'template' && node.content && node.content.childNodes) {
            node.content.childNodes.forEach(childNode => this.traverse(childNode));
        }

        if (this.shouldIgnore(node)) {
            return;
        }

        if ('tagName' in node) {
            this.parseAttrs(node);
        }
        if (node.nodeName === '#text') {
            this.parseInnerText(node as parse5.ParseTextNode);
        }
        if (this.visitorHookSkip('parseNode', node)) {
            return;
        }
    }

    /**
     * 解析属性
     */
    parseAttrs(node: parse5.ParseTagNode) {
        if ('attrs' in node && node.attrs) {
            if (this.visitorHookSkip('parseAttrs', node)) {
                return;
            }
            for (let i = 0; i < node.attrs.length; i++) {
                const attr = node.attrs[i];
                // 如果不是需要提取的属性或者是忽略属性则跳过
                if (
                    !this.isPrimary(attr.value, 'parseAttrs')
                    || this.ignoreAttrs(attr.name)
                ) {
                    continue;
                }
                if (this.visitorHookSkip('parseAttr', node, attr)) {
                    continue;
                }
                // 普通属性
                if (this.isPrimary(attr.value, 'parseAttrs')) {
                    const { i18nMethod } = this.config;
                    const newValue = `${i18nMethod}('${this.makeKey(attr.value, true)}')`;
                    // const newValue = this.parseAsJs(`'${this.formatKeyForAttr(attr.value)}'`);
                    if (!this.extractOnly) {
                        attr.name = `:${attr.name}`;
                        attr.value = newValue;
                        this.hasChange = true;
                    }
                }
            }
        }
    }

    /**
     * 解析innerText
     */
    parseInnerText(node: parse5.ParseTextNode) {
        // 需要处理替换函数中的key
        if (this.visitorHookSkip('parseInnerText', node)) {
            return;
        }
        const tokens = this.parseStrByHogan(node.value);
        let newValue = '';
        let hasChange = false;
        for (const token of tokens) {
            if (token.tag === '_t') {
                if (this.isPrimary(token.text, 'parseInnerText')) {
                    try {
                        // 普通字符串
                        const { i18nMethod } = this.config;
                        const textArr = token.text.split(/(&nbsp;)/);
                        const _textArr = textArr.map((itemText: string) => {
                            if (this.isPrimary(itemText, 'parseInnerText')) {
                                const key = this.makeKey(itemText, true);
                                const _itemText = `{{${i18nMethod}('${key}')}}`;
                                hasChange = true;
                                return _itemText;
                            }
                            return itemText;
                        })
                        newValue += _textArr.join('');
                        // let code = this.parseAsJs(`'${this.formatKeyForAttr(token.text)}'`);
                        // newValue = `{{${code}}}`;
                    } catch(e) {
                        console.log(`=====代码解析错误，返回原始值=====`);
                        console.log(`错误信息: ${e}`);
                        if (this.scene) {
                            console.log(`${this.scene}`);
                        }
                        console.log('==========================');
                        newValue += token.text;
                    }
                } else {
                    newValue += token.text;
                }
            } else if (token.tag === '_v') {
                try {
                    let source = this.parseAsJs(token.n);
                    hasChange = hasChange || this.parseJSInstance.hasChange
                    if (source.startsWith(';')) {
                        source = source.slice(1);
                    }
                    newValue += `{{${source}}}`;
                } catch(e) {
                    console.log(`=====代码解析错误，返回原始值=====`);
                    console.log(`错误信息: ${e}`);
                    if (this.scene) {
                        console.log(`${this.scene}`);
                    }
                    console.log('==========================');
                    newValue += token.n;
                }
            } else {
                newValue += token.tag;
            }
        }
        this.hasChange = this.hasChange || hasChange;
        if (node.value !== newValue) {
            if (!this.extractOnly) {
                node.value = newValue;
            }
        }
    }

    parseStrByHogan(str: string) {
        delete Hogan.tags['{'];
        delete Hogan.tags['$'];
        const tokens = Hogan.scan(str);
        Hogan.tags['{'] = 10;
        Hogan.tags['$'] = 4;
        return tokens
    }

    parseAsJs(code: string) {
        const newCode = this.parseJSInstance.parseCode(code, this.scene);
        return prettier.format(newCode, {
            parser: this.isTS ? 'typescript' : 'babel',
            singleQuote: true,
            semi: false,
            printWidth: 10000000,
        }).replace(/\s*$/, '');
    }
}

export default ParseHTML;