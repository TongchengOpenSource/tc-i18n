import * as babel from '@babel/core';
import * as t from '@babel/types';
import { FRAMEWORK, SOURCE_TYPE } from 'src/constant';
import type { Tci18nConfig } from 'types';
import ParseJS, { Hook } from '../index';
import BaseParse from '../../BaseParse';

class MiniprogramVisitor extends BaseParse {
    config: Tci18nConfig;
    scene?: string;
    parseJSMethods: Partial<Pick<ParseJS, keyof ParseJS>>;
    miniprogramPackage = '@tc-i18n/miniprogram';
    constructor(
        config: Tci18nConfig,
        sourceType: SOURCE_TYPE,
        scene?: string,
        parseJSMethods?: Partial<Pick<ParseJS, keyof ParseJS>>,
    ) {
        super(config, sourceType, scene);
        this.config = { ...config };
        this.scene = scene;
        this.parseJSMethods = { ...(parseJSMethods || {}) };
    }

    get primaryLocale() {
        return {
            ...this.primaryLocaleData
        }
    }

    load(hooks: Hook) {
        const { framework } = this.config;
        if (![FRAMEWORK.MINIPROGRAM].includes(framework)) {
            return;
        }
        hooks.parsing.tap('StringLiteral', this.StringLiteral.bind(this));
        hooks.parsing.tap('ExpressionStatement', this.ExpressionStatement.bind(this));
        hooks.parsing.tap('ObjectExpression', this.ObjectExpression.bind(this));
    }

    ExpressionStatement(
        path: babel.NodePath<babel.types.ExpressionStatement>, 
    ) {
        if (
            path.parent.type !== 'Program'
            || path.node.expression.type !== 'CallExpression'
        ) {
            return;
        }
        const { callee } = path.node.expression;
        if (callee.type !== 'Identifier') {
            return;
        }
        let hasImport = false;
        let hasChange = false;
        const isPage = callee.name === 'Page';
        const isComponent = callee.name === 'Component';
        if (path.node.expression.callee.type === 'Identifier') {
            isPage && (path.node.expression.callee.name = 'Tci18nPage');
            isComponent && (path.node.expression.callee.name = 'Tci18nComponent');
        }
        // 自动引入Tci18nPage/Tci18nComponent
        if (isPage || isComponent) {
            if (path.parentPath.node.type === 'Program') {
                const pkgName = this.miniprogramPackage;
                const v = this.config.importCode.match(/\{\s*(intl)\s*\} /);
                const pkgValue = v ? v[1] : '';
                const importNodes = path.parentPath.node.body.filter(node => node.type === 'ImportDeclaration') as babel.types.ImportDeclaration[];
                const findIndex = importNodes.findIndex(node => node.source.value === pkgName);
                const pageType = isPage ? 'Tci18nPage' : 'Tci18nComponent';
                if (findIndex > -1) {
                    // 存在tci18n-miniprogram
                    hasImport = true;
                    const specifiers = importNodes[findIndex].specifiers;
                    const findPageType = specifiers.find(specifier => specifier.type === 'ImportSpecifier' && specifier.imported.type === 'Identifier' && specifier.imported.name === (pageType));
                    if (!findPageType) {
                        // 不存在，则自动注入
                        importNodes[findIndex].specifiers.push(t.importSpecifier(t.identifier(pageType), t.identifier(pageType)))
                    }
                    // if (specifiers)
                    const findIntl = specifiers.find(specifier => {
                        if (
                            specifier.type === 'ImportSpecifier'
                            && specifier.imported.type === 'Identifier'
                        ) {
                            return specifier.imported.name === (pkgValue);
                        }
                        return false;
                    });
                    if (!findIntl) {
                        importNodes[findIndex].specifiers.push(t.importSpecifier(t.identifier(pkgValue), t.identifier(pkgValue)))
                    }
                } else {
                    // 不存在，则自动引入tci18n-miniprogram
                    path.parentPath.node.body.unshift(
                        t.importDeclaration([
                            t.importSpecifier(t.identifier(pageType), t.identifier(pageType)),
                            t.importSpecifier(t.identifier(pkgValue), t.identifier(pkgValue))
                        ],
                        t.stringLiteral(pkgName))
                    );
                    hasImport = true;
                }
                hasChange = true;
            }
        }
        return {
            HAS_IMPORT: hasImport,
            HAS_CHANGE: hasChange,
        }
    }

    ObjectExpression(path: babel.NodePath<babel.types.ObjectExpression>) {
        if (!this.parseJSMethods.makeReplace) {
            return;
        }
        if (
            path.parent.type !== 'CallExpression'
            || path.parent.callee.type !== 'Identifier'
            || !['Tci18nPage', 'Page', 'App'].includes(path.parent.callee.name)
        ) {
            return;
        }
        let hasImport = false;
        let hasChange = false;
        if (path.parent.callee.name === 'App') {
            hasImport = true;
        }
        // 处理小程序Page中的data
        const jsonPath = this.scene?.replace(/\.\w+$/g, '.json');
        if (!jsonPath || !this.existsSync(jsonPath)) {
            return {
                HAS_IMPORT: hasImport,
                HAS_CHANGE: hasChange,
            }
        }
        const jsonStr = this.readFileSync(jsonPath);
        const json = JSON.parse(jsonStr);
        const NavigationBarTitle = 'navigationBarTitleText';
        // 获取NavigationBarTitle的值
        let key = '';
        if (json['window'] && json['window'][NavigationBarTitle]) {
            key = json['window'][NavigationBarTitle]
        } else if(json[NavigationBarTitle]) {
            key = json[NavigationBarTitle]
        }
        if (key! || !this.isPrimary(key, 'ObjectExpression')) {
            return {
                HAS_IMPORT: hasImport,
                HAS_CHANGE: hasChange,
            }
        }

        const { node } = path;
        // 1.找到onLoad函数
        const findOnLoadIndex = node.properties.findIndex((prop) => 
            (prop.type === 'ObjectMethod' || prop.type === 'ObjectProperty')
            && prop.key.type === 'Identifier'
            && ['onLoad'].includes(prop.key.name));
        const findOnLaunchIndex = node.properties.findIndex((prop) => 
            (prop.type === 'ObjectMethod' || prop.type === 'ObjectProperty')
            && prop.key.type === 'Identifier'
            && ['onLaunch'].includes(prop.key.name));
        const expressionStatement = t.expressionStatement(
            t.callExpression(
                t.memberExpression(
                    t.identifier('wx'),
                    t.identifier('setNavigationBarTitle')
                ),
                [
                    t.objectExpression(
                        [
                            t.objectProperty(
                                t.identifier('title'),
                                this.parseJSMethods.makeReplace(key)
                            )
                        ]
                    )
                ]
            )
        )
        const nodeIndex = findOnLaunchIndex > -1 ? findOnLaunchIndex : findOnLoadIndex;
        if (nodeIndex > -1) {
            // 存在onLoad/onLaunch函数
            const setBodyNode = (onLoadBodyNodes: babel.types.Statement[]) => {
                const hasSetNavigationBarTitle = onLoadBodyNodes.some(node => {
                    if (
                        node.type === 'ExpressionStatement'
                        && node.expression.type === 'CallExpression'
                    ) {
                        const { callee } = node.expression;
                        if (
                            callee.type === 'MemberExpression'
                            && callee.object.type === 'Identifier'
                            && callee.object.name === 'wx'
                            && callee.property.type === 'Identifier'
                            && callee.property.name === 'setNavigationBarTitle'
                        ) {
                            return true
                        }
                    }
                    return false
                })
                if (!hasSetNavigationBarTitle) {
                    onLoadBodyNodes.push(expressionStatement)
                }
            }
            const nodeItem = node.properties[nodeIndex];
            if (nodeItem.type === 'ObjectProperty') {
                if (
                    nodeItem.value.type === 'FunctionExpression'
                    || nodeItem.value.type === 'ArrowFunctionExpression'
                ) {
                    if (nodeItem.value.body.type === 'BlockStatement') {
                        const onLoadBodyNodes = nodeItem.value.body.body
                        setBodyNode(onLoadBodyNodes);
                    }
                }
            } else if (nodeItem.type === 'ObjectMethod') {
                const onLoadBodyNodes = nodeItem.body.body;
                setBodyNode(onLoadBodyNodes);
            }
        } else {
            // 不存在onLoad/onLaunch函数，则新增onLoad函数
            node.properties.push(
                t.objectMethod(
                    'method',
                    t.identifier(path.parent.callee.name === 'App' ? 'onLaunch' : 'onLoad'),
                    [],
                    t.blockStatement([expressionStatement])
                )
            )
        }
        hasChange = true;
        return {
            HAS_IMPORT: hasImport,
            HAS_CHANGE: hasChange,
        }
    }

    StringLiteral(path: babel.NodePath<babel.types.StringLiteral>) {
        const isInSwitchCase = path.parentPath.type === 'SwitchCase' && path.parentPath.listKey === 'cases';
        return {
            SKIP: isInSwitchCase
        }
    }
}

export default MiniprogramVisitor;