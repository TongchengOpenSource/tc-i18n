import pluginSyntaxAsyncGenerators from '@babel/plugin-syntax-async-generators';
import pluginSyntaxClassProperties from '@babel/plugin-syntax-class-properties';
import pluginProposalDecorators from '@babel/plugin-proposal-decorators';
import pluginSyntaxDoExpressions from '@babel/plugin-syntax-do-expressions';
import pluginSyntaxFunctionBind from '@babel/plugin-syntax-function-bind';
import pluginSyntaxJsx from '@babel/plugin-syntax-jsx';
import pluginSyntaxObjectRestSpread from '@babel/plugin-syntax-object-rest-spread';
import * as babel from '@babel/core';
import { ParseResult } from '@babel/core';
import BabelPresets from '@babel/preset-env';
import * as t from '@babel/types';
import type * as TType from '@babel/types';
import generate from '@babel/generator';
import traverse from '@babel/traverse';
import presetTypescript from '@babel/preset-typescript';
import prettier from 'prettier';
import Notify from 'notify';
import type { Tci18nConfig, HookReturn } from 'types';
import { SOURCE_TYPE, FRAMEWORK } from 'src/constant';
import MiniprogramVisitor from './miniprogram/Visitor';
import VueVisitor from './vue/Visitor';
import BaseParse from '../BaseParse';

interface ParsingTabType {
    TemplateLiteral: (path: babel.NodePath<babel.types.TemplateLiteral>, t: typeof TType) => void | HookReturn;
    StringLiteral: (path: babel.NodePath<babel.types.StringLiteral>, t: typeof TType) => void | HookReturn;
    ImportDeclaration: (path: babel.NodePath<babel.types.ImportDeclaration>, t: typeof TType) => void | HookReturn;
    ExpressionStatement: (path: babel.NodePath<babel.types.ExpressionStatement>, t: typeof TType) => void | HookReturn;
    Identifier: (path: babel.NodePath<babel.types.Identifier>, t: typeof TType) => void | HookReturn;
    DirectiveLiteral: (path: babel.NodePath<babel.types.DirectiveLiteral>, t: typeof TType) => void | HookReturn;
    ObjectExpression: (path: babel.NodePath<babel.types.ObjectExpression>, t: typeof TType) => void | HookReturn;
    CallExpression: (path: babel.NodePath<babel.types.CallExpression>, t: typeof TType) => void | HookReturn;
    ArrowFunctionExpression: (path: babel.NodePath<babel.types.ArrowFunctionExpression>, t: typeof TType) => void | HookReturn;
    ObjectMethod: (path: babel.NodePath<babel.types.ObjectMethod>, t: typeof TType) => void | HookReturn;
    FunctionDeclaration: (path: babel.NodePath<babel.types.FunctionDeclaration>, t: typeof TType) => void | HookReturn;
    JSXElement: (path: babel.NodePath<babel.types.JSXElement>, t: typeof TType) => void | HookReturn;
    JSXText: (path: babel.NodePath<babel.types.JSXText>, t: typeof TType) => void | HookReturn;
    JSXAttribute: (path: babel.NodePath<babel.types.JSXAttribute>, t: typeof TType) => void | HookReturn;
    makeI18nFunction: (args: Array<babel.types.ArgumentPlaceholder | babel.types.SpreadElement | babel.types.Expression>, t: typeof TType) => void | HookReturn;
}

interface ParseTabType {
    ignoreLines: (comments: ParseResult['comments']) => number[];
}

interface ParsedTabType {
    parseCode: (code: string) => string;
}

export type Hook = {
    parse: Notify<ParseTabType>,
    parsing: Notify<ParsingTabType>,
    parsed: Notify<ParsedTabType>,
}

let parseJSInstance: ParseJS;
class ParseJS extends BaseParse {
    config: Tci18nConfig;
    sourceType: SOURCE_TYPE;
    scene?: string;
    isTS = false;
    /**
     * 需要忽略的行，通过注释获取
     */
    ignoreLines: number[] = [];
    /**
     * 小程序的AST hooks
     */
    miniprogramVisitor?: MiniprogramVisitor;
    /**
     * vue的AST hooks
     */
    vueVisitor?: VueVisitor;
    /**
     * 是否需要自动引入import代码
     * 比如：html部分不需要引入
     */
    needImport = true;
    /**
     * 替换函数是否需要i18n对象
     * 比如：vue的html部分只需要$t即可
     */
    needI18nObject = true;
    /**
     * 是否有import声明
     */
    hasImport = false;
    /**
     * 是否有改变
     */
    hasChange = false;
    /**
     * 关键点钩子函数
     */
    hooks: Hook;
    /**
     * 单次解析提取到的目标字符串
     */
    oncePrimaryLocale: string[] = [];

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
            parse: new Notify(),
            parsing: new Notify(),
            parsed: new Notify(),
        };
        const { framework } = this.config;
        if ([FRAMEWORK.VUE2, FRAMEWORK.VUE3].includes(framework)) {
            this.vueVisitor = new VueVisitor(config, sourceType, scene);
            this.vueVisitor.load(this.hooks);
        }
        if ([FRAMEWORK.MINIPROGRAM].includes(framework)) {
            this.miniprogramVisitor = new MiniprogramVisitor(config, sourceType, scene, {
                makeReplace: this.makeReplace.bind(this),
            });
            this.miniprogramVisitor.load(this.hooks);
        }
        this.hooks.parsing.tap('StringLiteral', this.ignoreAST.bind(this));
    }

    get primaryLocale() {
        return {
            ...this.primaryLocaleData,
            ...this.vueVisitor?.primaryLocale,
            ...this.miniprogramVisitor?.primaryLocale,
        }
    }

    static getInstance(config: Tci18nConfig, sourceType: SOURCE_TYPE, scene?: string) {
        if (!parseJSInstance) {
            parseJSInstance = new ParseJS(config, sourceType, scene);
        }
        return parseJSInstance;
    }

    setHooks(hooks: Hook) {
        this.hooks = hooks;
    }

    generateCode(ast: babel.types.Node, sourceCode?: string) {
        return generate(ast, { retainLines: true, decoratorsBeforeExport: true }, sourceCode);
    }

    /**
     * 解析JS代码
     * @param sourceCode 源代码
     * @param scene 场景值
     */
    parseCode(sourceCode: string, scene?: string, prettierOptions = {}) {
        scene && (this.scene = scene);
        this.oncePrimaryLocale = [];
        const ast = this.getASTByBabel(sourceCode, {
            filename: this.scene,
        });
        this.ignoreLines = this.getIgnoreLines(ast?.comments);
        if (ast) {
            try {
                traverse(ast, {
                    ExpressionStatement: this.ExpressionStatement.bind(this),
                    Identifier: this.Identifier.bind(this),
                    ImportDeclaration: this.ImportDeclaration.bind(this),
                    TemplateLiteral: this.TemplateLiteral.bind(this),
                    DirectiveLiteral: this.DirectiveLiteral.bind(this),
                    StringLiteral: this.StringLiteral.bind(this),
                    ObjectExpression: this.ObjectExpression.bind(this),
                    CallExpression: this.CallExpression.bind(this),
                    ArrowFunctionExpression: this.ArrowFunctionExpression.bind(this),
                    ObjectMethod: this.ObjectMethod.bind(this),
                    FunctionDeclaration: this.FunctionDeclaration.bind(this),
                    JSXElement: this.JSXElement.bind(this),
                    JSXText: this.JSXText.bind(this),
                    JSXAttribute: this.JSXAttribute.bind(this),
                });
            } catch(e) {
                throw e;
            }
            let { code } = this.generateCode(ast, sourceCode);
            if (this.hasChange) {
                // 有中文并且代码有变动但没有import则import
                const { importCode } = this.config;
                if (!this.extractOnly
                    && this.needImport
                    && this.hasPrimary
                    && this.hasChange
                    && !this.hasImport
                    && importCode
                ) {
                    code = this.generateImportCode(code);
                    if (
                        sourceCode.trim().includes('use client')
                    ) {
                        // 把use client放到第一行
                        const codeLines = code.split('\n');
                        const lineIndex = codeLines.findIndex((line) => /['"]use client['"];?/.test(line));
                        codeLines[lineIndex] = codeLines[lineIndex].replace(/['"]use client['"];?/, '');
                        if (!codeLines[lineIndex].trim()) {
                            codeLines.splice(lineIndex, 1);
                        }
                        codeLines.splice(0, 0, '\"use client\"');
                        code = codeLines.join('\n');
                    }
                }
                code = this.hooks.parsed.callByNameAsFlow<string>('parseCode', code);
                if (prettierOptions && Object.keys(prettierOptions).length){
                    code = prettier.format(code, {
                        parser: 'babel',
                        ...prettierOptions,
                    });
                }
                return code;
            }
        }
        return sourceCode;
    }

    generateImportCode(sourceCode: string) {
        const ast = this.getASTByBabel(sourceCode, {
            filename: this.scene,
        });
        if (ast) {
            try {
                traverse(ast, {
                    ImportDeclaration: this.ImportDeclaration.bind(this),
                });
            } catch(e) {
                throw e;
            }
            if (!this.hasImport) {
                const specifiers: babel.types.ImportSpecifier[] = [];
                specifiers.push(t.importSpecifier(t.identifier('intl'), t.identifier('intl')));
                const m = this.config.importCode.match(/from ["'](.*)["']/);
                const pkgName = m ? m[1] : '';
                ast.program.body.unshift(
                    t.importDeclaration(specifiers, t.stringLiteral(pkgName))
                )
            }
            let { code } = this.generateCode(ast, sourceCode);
            return code;
        }
        return sourceCode;
    }

    /**
     * 通过babel获取js的AST
     * @param code 源代码
     * @param options babel.TransformOptions配置
     * @returns ParseResult
     */
    getASTByBabel(code: string, options: babel.TransformOptions): ParseResult | null {
        const presets: babel.TransformOptions['presets'] = [];
        if (this.isTS) {
            presets.push([presetTypescript, { isTSX: true, allExtensions: true }]);
        }
        presets.push(BabelPresets);
        const { isDecorator } = this.config;
        const plugins = [
            pluginSyntaxAsyncGenerators,
            pluginSyntaxClassProperties,
            pluginSyntaxDoExpressions,
            pluginSyntaxFunctionBind,
            pluginSyntaxJsx,
            pluginSyntaxObjectRestSpread
        ];
        isDecorator && plugins.push([
            pluginProposalDecorators,
            {
                decoratorsBeforeExport: true,
            }
        ]);
        const ast = babel.parseSync(code, {
            ast: true,
            sourceType: 'module',
            babelrc: false,
            presets,
            plugins,
            ...options
        });
        return ast;
    }
    
    /**
     * 通过注释获取需要忽略的行
     * @param comments AST中的注释
     * @returns 
     */
    getIgnoreLines(comments?: ParseResult['comments']): number[] {
        let ignores: number[] = [];
        if (Array.isArray(comments)) {
            for(let comment of comments) {
                const { type, value, loc } = comment;
                if (loc && value.trim().includes('tci18n-ignore-line')) {
                    if (type === 'CommentBlock') {
                        // 多行注释
                        ignores.push(loc.end.line + 1);
                    } else if (type === 'CommentLine') {
                        // 单行注释
                        ignores.push(loc.end.line + 1);
                    }
                }
            }
        }
        const pluginIgnores = this.hooks.parse.callByName<number>('ignoreLines', comments)?.flat() || [];
        return [...ignores, ...pluginIgnores];
    }

    shouldIgnore(node: babel.Node) {
        if (node.loc) {
            // node may not have loc
            return this.ignoreLines.includes(node.loc.start.line);
        }
        return false;
    }

    visitorHookSkip(type: string, path: babel.NodePath) {
        const params = this.hooks.parsing.callByName<HookReturn>(type, path, t);
        let hasSkip = false;
        let hasImport = false;
        let hasChange = false;
        if (params) {
            hasSkip = params.some((param) => 'SKIP' in param && param.SKIP);
            hasImport = params.some((param) => 'HAS_IMPORT' in param && param.HAS_IMPORT);
            hasChange = params.some((param) => 'HAS_CHANGE' in param && param.HAS_CHANGE);
            this.hasImport = this.hasImport || hasImport;
            this.hasChange = this.hasChange || hasChange;
        }
        return hasSkip;
    }

    /**
     * 通过ignoreStrings配置项判断是否忽略
     * @param path AST路径
     * @returns 
     */
    ignoreStringsFromTemplateLiteralAndStringLiteral(path: babel.NodePath) {
        const { node } = path;
        const STRING = 'StringLiteral';
        const TEMPLATE = 'TemplateLiteral';
        if (![STRING, TEMPLATE].includes(node.type)) {
            // 只处理字符串
            return false;
        }
        let value = '';
        if (node.type === STRING) {
            value = node.value;
        } else if (node.type === TEMPLATE) {
            let { code } = this.generateCode(node);
            value = code.replace(/^`/g, '').replace(/`$/g, '');
        }
        return this.ignoreStrings(value);
    }

    /**
     * 通过ignoreMethods配置项判断是否忽略
     */
    ignoreMethodFromStringLiteral(path: babel.NodePath<babel.types.StringLiteral>) {
        if (path.parent.type !== 'CallExpression') {
            return false;
        }
        const { callee } = path.parent;
        let methodName = '';
        if (callee.type === 'MemberExpression') {
            let { code } = this.generateCode(callee);
            methodName = code.replace(/\s/g, '');
        }
        if (callee.type === 'Identifier') {
            methodName = callee.name;
        }
        return this.ignoreMethods(methodName);
    }

    ignoreAST(path: babel.NodePath<babel.types.StringLiteral>) {
        const { ignoreAST } = this.config;
        if (ignoreAST) {
            const memberExpression = () => {
                if (
                    path.parent.type === 'MemberExpression' && 
                    ignoreAST.MemberExpression &&
                    (
                        typeof ignoreAST.MemberExpression === 'boolean' ||
                        (
                            typeof ignoreAST.MemberExpression === 'object' &&
                            ignoreAST.MemberExpression[path.parent.object.type] &&
                            path.parent.object.type === 'Identifier' &&
                            ignoreAST.MemberExpression[path.parent.object.type].includes(path.parent.object.name)
                        )
                    )
                ) {
                    return {
                        SKIP: true,
                    }
                }
            }
            const binaryExpression = () => {
                if (
                    path.parent.type === 'BinaryExpression' &&
                    ignoreAST.BinaryExpression &&
                    (
                        typeof ignoreAST.BinaryExpression === 'boolean' ||
                        (
                            typeof ignoreAST.BinaryExpression === 'object' &&
                            (
                                (
                                    path.key === 'left' && 
                                    Array.isArray(ignoreAST.BinaryExpression.left) &&
                                    ignoreAST.BinaryExpression.left.includes((path.parent.left as babel.types.StringLiteral).value || (path.parent.left as babel.types.Identifier).name)
                                ) ||
                                (
                                    path.key === 'right' && 
                                    Array.isArray(ignoreAST.BinaryExpression.right) &&
                                    ignoreAST.BinaryExpression.right.includes((path.parent.right as babel.types.StringLiteral).value || (path.parent.right as babel.types.Identifier).name)
                                )
                            )
                        )
                    )
                ) {
                    return {
                        SKIP: true,
                    }
                }
            }
            const switchCase = () => {
                if(
                    path.parent.type === 'SwitchCase' && 
                    ignoreAST.SwitchCase
                ) {
                    return {
                        SKIP: true,
                    }
                }
            }
            const ignore = {
                MemberExpression: memberExpression,
                BinaryExpression: binaryExpression,
                SwitchCase: switchCase
            }
            if (ignore[path.parent.type] instanceof Function) {
                return ignore[path.parent.type]();
            }
        }
    }

    /**
     * 处理import声明
     */
    ImportDeclaration(path: babel.NodePath<babel.types.ImportDeclaration>) {
        if (this.visitorHookSkip('ImportDeclaration', path)) {
            return;
        }
        const { importCode } = this.config;
        const m = importCode.match(/from ["'](.*)["']/);
        const v = importCode.match(/\{\s*(intl)\s*\} /);
        const pkgName = m ? m[1] : '';
        const pkgValue = v ? v[1] : '';
        if (path.node.source.value === pkgName) {
            if (pkgValue) {
                this.hasImport = path.node.specifiers.some((specifier: any) => {
                    if (specifier.type === 'ImportSpecifier' && specifier.imported.type === 'Identifier') {
                        return specifier.imported.name === pkgValue;
                    }
                    return false;
                });
                if (this.hasChange && !this.hasImport) {
                    this.hasImport = true;
                    path.node.specifiers.push(t.importSpecifier(t.identifier('intl'), t.identifier('intl')));
                }
            }
        }
        path.skip();
    }

    /**
     * 表达式语句
     */
    ExpressionStatement(path: babel.NodePath<babel.types.ExpressionStatement>) {
        if (this.visitorHookSkip('ExpressionStatement', path)) {
            return;
        }
    }

    /**
     * 标识符
     */
    Identifier(path: babel.NodePath<babel.types.Identifier>) {
        if (this.visitorHookSkip('Identifier', path)) {
            return;
        }
        if (
            !this.extractOnly
            && path.parent.type === 'ExpressionStatement'
            && this.isPrimary(path.node.name, 'Identifier'))
        {
            this.replaceWith(path, this.makeReplace(path.node.name as string));
            path.skip();
        }

        /**
         * 提取对象里面的中文键名
         */
        if (
            !this.extractOnly
            && path.parent.type === 'ObjectProperty'
            && this.isPrimary(path.node.name, 'Identifier')
        ) {
            path.parent.key = this.makeReplace(path.node.name);
            path.parent.computed = true;
            path.skip();
        }
    }

    /**
     * 指令字符串，一般写在代码最上面
     */
    DirectiveLiteral(path: babel.NodePath<babel.types.DirectiveLiteral>) {
        const { node } = path;
        if (this.shouldIgnore(node) || !this.isPrimary(node.value, 'DirectiveLiteral')) {
            return;
        }
        if (this.visitorHookSkip('DirectiveLiteral', path)) {
            return;
        }
        this.replaceWith(path.parentPath, t.expressionStatement(this.makeReplace(node.value)))
        path.skip();
    }
    /**
     * 模板字符串
     */
    TemplateLiteral(path: babel.NodePath<babel.types.TemplateLiteral>) {
        const { node } = path;
        if (this.shouldIgnore(node) || this.ignoreStringsFromTemplateLiteralAndStringLiteral(path)) {
            // 忽略字符串
            return;
        }
        // 判断是否存在需要提取的字符串
        const hasPrimary = node.quasis.some(word => this.isPrimary(word.value.cooked || '', 'TemplateLiteral'));
        if (!hasPrimary) {
            return;
        }
        if (this.visitorHookSkip('TemplateLiteral', path)) {
            return;
        }
        const tempArr = [...node.quasis, ...node.expressions];
        tempArr.sort((a, b) => a.start! - b.start!);
        let value = '';
        const variable: Record<string, any> = {};
        let needReplace = false;
        let slotIndex = 0;
        tempArr.forEach((nd) => {
            if (nd.type === 'TemplateElement') {
                value += nd.value.cooked;
                if (this.isPrimary(nd.value.cooked, 'TemplateLiteral')) {
                    needReplace = true;
                }
            } else if (nd.type === 'Identifier') {
                value += `{${nd.name}}`;
                variable[nd.name] = nd.name;
                needReplace = true;
            } else {
                // 例如 CallExpression 等
                const identifier = `slot${slotIndex++}`;
                value += `{${identifier}}`;
                variable[identifier] = { isAstNode: true, value: nd };
                needReplace = true;
            }
        });
        if (needReplace && value.trim()) {
            this.replaceWith(path, this.makeReplace(value, true, Object.keys(variable).length ? variable : undefined));
            path.skip();
        }
    }

    /**
     * 字符串 代码中所有的字符串统一由此处理
     */
    StringLiteral(path: babel.NodePath<babel.types.StringLiteral>) {
        const { node } = path;
        // 需要排除ts中的type和enum
        const isTsLiteralType = node.type === 'StringLiteral' && (['TSLiteralType', 'TSEnumMember'].includes(path.parent.type));
        if (isTsLiteralType) {
            return;
        }
        if (
            !this.isPrimary(node.value, 'StringLiteral')
            || this.shouldIgnore(node)
            || this.ignoreStringsFromTemplateLiteralAndStringLiteral(path)
        ) {
            // 忽略字符串
            return;
        }
        // 由扩展hook判断是否继续执行
        if (this.visitorHookSkip('StringLiteral', path)) {
            return;
        }
        switch(path.parent.type) {
            case 'ObjectProperty':
                if (path.key === 'key') {
                    // 健名为中文
                    path.parent.key = this.makeReplace(node.value);
                    path.parent.computed = true;
                }
            case 'AssignmentExpression':
                if (path.key !== 'key') {
                    this.replaceWith(path, this.makeReplace(node.value));
                }
                break;
            case 'CallExpression':
                if (this.ignoreMethodFromStringLiteral(path)) {
                    break;
                }
                this.replaceWith(path, this.makeReplace(node.value));
                break;
            case 'NewExpression':
                // 比如：new Error('预订房间')
                this.replaceWith(path, this.makeReplace(node.value));
                break;
            case 'JSXAttribute':
                // jsx元素的属性为中文
                if (
                    path.parentPath.parent.type === 'JSXOpeningElement'
                    && path.parentPath.parent.name.type === 'JSXIdentifier'
                    && this.ignoreComponents(path.parentPath.parent.name.name)
                ) {
                    break;
                }
                this.replaceWith(path,
                    t.jSXExpressionContainer(this.makeReplace(node.value))
                );
                break;
            case 'MemberExpression':
                // 需要支持ignoreAST
                this.replaceWith(path, this.makeReplace(node.value));
                break;
            case 'BinaryExpression':
                // 需要支持ignoreAST
                // 二进制运算符中的中文
                this.replaceWith(path, this.makeReplace(node.value));
                break;
            case 'SwitchCase': 
                // 需要支持ignoreAST
                this.replaceWith(path, this.makeReplace(node.value));
                break;
            default:
                this.replaceWith(path, this.makeReplace(node.value));
                break;
        }
        path.skip();
    }

    /**
     * 对象表达式
     */
    ObjectExpression(path: babel.NodePath<babel.types.ObjectExpression>) {
        // 由扩展hook判断是否继续执行
        if (this.visitorHookSkip('ObjectExpression', path)) {
            return;
        }
    }

    /**
     * 函数调用
     */
    CallExpression(path: babel.NodePath<babel.types.CallExpression>) {
        if (this.shouldIgnore(path.node)) {
            path.skip();
            return;
        }
        // 由扩展hook判断是否继续执行
        if (this.visitorHookSkip('CallExpression', path)) {
            return;
        }

        // 获取函数名字，由ignoreMethods配置项判断是否忽略
        let methodName = '';
        if (path.node.callee.type === 'Identifier') {
            methodName = path.node.callee.name;
        }
        if (path.node.callee.type === 'MemberExpression') {
            const { code } = this.generateCode(path.node.callee);
            methodName = code;
        }
        if (this.ignoreMethods(methodName)) {
            path.skip();
            return;
        }

        let isMatchI18nMethod = false;
        const { i18nObject, i18nMethod } = this.config;
        if (path.node.callee.type === 'MemberExpression' && path.node.callee.object) {
            // intl.$t('')
            const { code: intlObjectCode } = this.generateCode(path.node.callee.object);
            isMatchI18nMethod = intlObjectCode.replace(/\s/g, '') === i18nObject
                && path.node.callee.property.type === 'Identifier'
                && path.node.callee.property.name === i18nMethod;
        }
        if (path.node.callee.type === 'Identifier') {
            // $t('')
            isMatchI18nMethod = path.node.callee.name === i18nMethod;
        }

        // 是否是替换函数，如果是则提取里面的字符串当key
        if (isMatchI18nMethod) {
            const args = path.node.arguments;
            let key = '';
            if (args[0]) {
                // 取出key
                if (args[0].type === 'StringLiteral') {
                    key = args[0].value;
                }
                if (args[0].type === 'TemplateLiteral') {
                    key = args[0].quasis[0].value.raw;
                }
            }
            this.collectKey(key);
            this.oncePrimaryLocale.push(key);
            path.skip();
        }
    }

    /**
     * 箭头函数
     */
    ArrowFunctionExpression(path: babel.NodePath<babel.types.ArrowFunctionExpression>) {
        if (this.visitorHookSkip('ArrowFunctionExpression', path)) {
            return;
        }
        // 箭头函数在对象中 { a: () => {} }
        if (
            path.parentPath.node.type === 'ObjectProperty'
            && path.parentPath.node.key.type === 'Identifier'
            && this.ignoreMethods(path.parentPath.node.key.name)
        ) {
            path.skip();
        }
        // 箭头函数在变量中 const a = () => {}
        if (
            path.parentPath.node.type === 'VariableDeclarator'
            && path.parentPath.node.id.type === 'Identifier'
            && this.ignoreMethods(path.parentPath.node.id.name)
        ) {
            path.skip();
        }
    }

    /**
     * 对象方法
     */
    ObjectMethod(path: babel.NodePath<babel.types.ObjectMethod>) {
        if (this.visitorHookSkip('ObjectMethod', path)) {
            return;
        }
        // 对象函数 { a() {} }
        if (
            path.node.key.type === 'Identifier'
            && this.ignoreMethods(path.node.key.name)
        ) {
            path.skip();
        }
    }

    /**
     * 函数声明
     */
    FunctionDeclaration(path: babel.NodePath<babel.types.FunctionDeclaration>) {
        if (this.visitorHookSkip('FunctionDeclaration', path)) {
            return;
        }
        // 普通函数 function a() {}
        if (path.node.id && this.ignoreMethods(path.node.id.name)) {
            path.skip();
        }
    }

    /**
     * JSX元素
     */
    JSXElement(path: babel.NodePath<babel.types.JSXElement & { ignore?: boolean }>) {
        if (path.node.ignore || this.shouldIgnore(path.node)) {
            return;
        }
        if (this.visitorHookSkip('JSXElement', path)) {
            return;
        }
        const { openingElement } = path.node;
    }

    /**
     * JSX文本
     */
    JSXText(path: babel.NodePath<babel.types.JSXText>) {
        if (this.shouldIgnore(path.node) || !this.isPrimary(path.node.value, 'JSXText')) {
            return;
        }
        if (this.visitorHookSkip('JSXText', path)) {
            return;
        }

        this.replaceWith(path, t.jSXExpressionContainer(this.makeReplace(path.node.value)));
        path.skip();
    }

    /**
     * JSX属性
     */
    JSXAttribute(path: babel.NodePath<babel.types.JSXAttribute>) {
        if (this.visitorHookSkip('JSXAttribute', path)) {
            return;
        }
        const { ignoreAttrs } = this.config;
        if (path.node.name.type === 'JSXIdentifier' && this.ignoreAttrs(path.node.name.name)) {
            return;
        }
    }

    replaceWith(path: babel.NodePath, value: any) {
        if (!this.extractOnly) {
            path.replaceWith(value);
        }
    }

    /**
     * 将字符串转化为替换后的代码
     * @param value 字符串 ps:进来的肯定是替换的字符串
     * @param isTemplateLiteral 是否是模板字符串
     */
    makeReplace(value: string, isTemplateLiteral = false, variables?: Record<string, any>) {
        this.hasChange = true;
        const { purePrimaryLocale, templateKeyWords = [] } = this.config;
        /** 如果满足以下其中一种情况
         * 1.只存在需要提取的字符串，
         * 2.模板字符串，
         * 3.没有配置只提取纯字符串，且templateKeyWords中不包含
         * 则直接返回对应的AST
        */
        const purePrimary = purePrimaryLocale instanceof RegExp ? new RegExp(purePrimaryLocale).test(value) : !!purePrimaryLocale
        if (
            this.isPurePrimary(value) ||
            isTemplateLiteral ||
            (!purePrimary && !templateKeyWords.some((key) => value.includes(key)))
        ) {
            return this.makeBinaryExpressionByArr(value.split(/(&\w+;)/), isTemplateLiteral, variables);
        } else {
            // 否则，将字符串按照需要提取的字符串进行分割
            const regStr = this.primaryRegx.source.slice(1, this.primaryRegx.source.length - 1);
            const arr = templateKeyWords.reduce((a, b) => a.split(b).join(`#!!!#${b}#!!!#`), value).split('#!!!#');
            let splitReg = new RegExp(`(\\s?[^${regStr}]+\\s?)|([${regStr}]+)`, 'g')
            if (typeof purePrimaryLocale === 'string' && purePrimaryLocale) {
                splitReg = new RegExp(`(\\s?[^${regStr}${purePrimaryLocale}]+\\s?)|([${regStr}${purePrimaryLocale}]+)`, 'g')
            }
            let strArr: any[] = [];
            arr.forEach((value) => {
                if (value) {
                    if (templateKeyWords.includes(value)) {
                        strArr.push(value);
                    } else {
                        if (purePrimary) {
                            const a = value.match(splitReg);
                            strArr.push(a);
                        } else {
                            strArr.push(value);
                        }
                    }
                }
            })
            strArr = strArr.flat();
            return this.makeBinaryExpressionByArr(strArr, isTemplateLiteral, variables);
        }
    }

    /**
     * 生成普通字符串AST
     * @param str 普通字符串
     */
    makeStringLiteral(str: string): babel.types.StringLiteral {
        return Object.assign(t.stringLiteral(str), {
            extra: {
                raw: `"${str}"`,
                rawValue: str,
            }
        });
    }

    /**
     * 生成模板字符串AST
     * @param str 模板字符串
     */
    makeTemplateLiteral(str: string): babel.types.TemplateLiteral {
        return t.templateLiteral([t.templateElement({
            cooked: str,
            raw: str,
        }, true)], []);
    }

    /**
     * 生成字符串AST
     * @param value 字符串
     * @param isTemplateLiteral 是否是模板字符串
     * @returns 
     */
    makeStringAST(str: string, isTemplateLiteral = false) {
        if (isTemplateLiteral) {
            return this.makeTemplateLiteral(str);
        }
        return this.makeStringLiteral(str);
    }

    /**
     * 通过字符串数组生成二元表达式AST
     * @param valueArr 字符串数组
     * @param isTemplateLiteral 是否是模板字符串
     * @param variables 模板字符串中的变量
     * @returns 
     */
    makeBinaryExpressionByArr(valueArr: string[], isTemplateLiteral = false, variables?: Record<string, any>) {
        const astArr = valueArr
            .filter((value) => value)
            .map((value) => {
                if (this.isPrimary(value)) {
                    const key = this.makeKey(value);
                    this.oncePrimaryLocale.push(key);
                    const keyAST = this.makeStringAST(key, isTemplateLiteral);
                    return this.makeI18nFunction(keyAST, variables);
                }
                return this.makeStringAST(value, isTemplateLiteral);
            });
        const genBinaryExpression = (
            left: babel.types.StringLiteral | babel.types.TemplateLiteral | babel.types.CallExpression | babel.types.BinaryExpression,
            right: babel.types.StringLiteral | babel.types.TemplateLiteral | babel.types.CallExpression | babel.types.BinaryExpression,
            rest: any[]
        ): babel.types.BinaryExpression => {
            if (rest.length) {
                return genBinaryExpression(t.binaryExpression('+', left, right), rest.shift(), rest)
            }
            return t.binaryExpression('+', left, right);
        }
        if (astArr.length > 1) {
            return genBinaryExpression(
                astArr.shift() as babel.types.StringLiteral | babel.types.TemplateLiteral | babel.types.CallExpression, 
                astArr.shift() as babel.types.StringLiteral | babel.types.TemplateLiteral | babel.types.CallExpression,
                astArr
            );
        }
        return astArr.shift() as babel.types.StringLiteral | babel.types.TemplateLiteral | babel.types.CallExpression;
    }

    /**
     * 将对象转化为对象表达式AST
     * @param obj 对象
     * @returns 
     */
    makeObjectExpression(obj?: Record<string, any>) {
        if (this.isObject(obj)) {
            const properties = Object.keys(obj).map((key) => {
                return t.objectProperty(t.stringLiteral(key), obj[key].isAstNode ? obj[key].value : t.identifier(obj[key]));
            });
            return t.objectExpression(properties);
        }
        return null;
    }

    /**
     * 生成替换函数AST代码
     * @param keyAST 键名AST
     * @param variables 模板字符串中的变量
     */
    makeI18nFunction(keyAST: babel.types.StringLiteral | babel.types.TemplateLiteral, variables?: Record<string, any>): babel.types.CallExpression {
        const { i18nObject, i18nMethod } = this.config;
        const args: Array<babel.types.ArgumentPlaceholder | babel.types.SpreadElement | babel.types.Expression> = [keyAST];
        const variablesAST = this.makeObjectExpression(variables);
        if (variablesAST) {
            args.push(variablesAST);
        };
        this.hooks.parsing.callByName('makeI18nFunction', args, t);
        if (this.needI18nObject && i18nObject) {
            return t.callExpression(
                t.memberExpression(
                    t.identifier(i18nObject),
                    t.identifier(i18nMethod)
                ),
                args,
            )
        }
        return t.callExpression(
            t.identifier(i18nMethod),
            args
        )
    }
}

export default ParseJS;