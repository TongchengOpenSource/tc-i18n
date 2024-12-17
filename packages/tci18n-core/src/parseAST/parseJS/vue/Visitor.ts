import * as babel from '@babel/core';
import * as t from '@babel/types';
import { FRAMEWORK, SOURCE_TYPE } from 'src/constant';
import type { Tci18nConfig } from 'types';
import { Hook } from '../index'
import BaseParse from '../../BaseParse';
import ParseHTML from '../../parseHTML';

class VueVisitor extends BaseParse {
    config: Tci18nConfig;
    scene?: string;
    parseHTML?: ParseHTML;
    constructor(config: Tci18nConfig, sourceType: SOURCE_TYPE, scene?: string) {
        super(config, sourceType, scene);
        this.config = { ...config };
        this.scene = scene;
    }

    get primaryLocale() {
        return {
            ...this.primaryLocaleData,
            ...this.parseHTML?.primaryLocale
        }
    }

    get parseHTMLInstance() {
        if (!this.parseHTML) {
            this.parseHTML = new ParseHTML(this.config, this.sourceType, this.scene);
            this.parseHTML.onlyBody = true;
        }
        return this.parseHTML;
    }

    load(hooks: Hook) {
        const { framework } = this.config;
        if (![FRAMEWORK.VUE2, FRAMEWORK.VUE3].includes(framework)) {
            return;
        }
        hooks.parsing.tap('StringLiteral', this.StringLiteral.bind(this));
        hooks.parsing.tap('TemplateLiteral', this.TemplateLiteral.bind(this));
    }

    /**
     * 判断是否是Vue.component
     * @param node 
     * @returns 
     */
    isVueCallExpression(node: babel.types.Node) {
        const { type } = node;
        if (type === 'CallExpression') {
            const { callee } = node;
            if (callee.type === 'MemberExpression') {
                const { object, property } = callee;
                if (
                    object.type === 'Identifier'
                    && object.name === 'Vue'
                    && property.type === 'Identifier'
                    && property.name === 'component'
                ) {
                    return true;
                }
            }
        }
        return false;
    }
    
    /**
     * 判断是否是template属性
     * @param node 
     * @returns 
     */
    isTemplateObjectProperty(node: babel.types.Node) {
        const { type } = node;
        if (type === 'ObjectProperty') {
            const { key } = node;
            if (key.type === 'Identifier' && key.name === 'template') {
                return true;
            }
        }
        return false;
    }

    StringLiteral(path: babel.NodePath<babel.types.StringLiteral>) {
        const rootNode =  path.parentPath?.parentPath?.parentPath?.node;
        // 如果不是vue.component.template里面的字符串则继续执行
        if (!rootNode || !this.isTemplateObjectProperty(path.parent) || !this.isVueCallExpression(rootNode)) {
            return;
        }
        
        // 若是，将template里面的字符串安装html进行解析，并跳过后续
        const code = this.parseHTMLInstance.parseCode(path.node.value, this.scene);
        path.replaceWith(Object.assign(t.stringLiteral(code), {
            extra: {
                rawValue: code,
                raw: `"${code}"`
            }
        }));
        path.skip();
        return {
            SKIP: true,
            HAS_CHANGE: this.parseHTMLInstance.hasChange
        }
    }

    TemplateLiteral(path: babel.NodePath<babel.types.TemplateLiteral>) {
        const rootNode =  path.parentPath?.parentPath?.parentPath?.node;
        // 如果不是vue.component.template里面的字符串则继续执行
        if (
            path.node.quasis.length > 1
            || !rootNode
            || !this.isTemplateObjectProperty(path.parent)
            || !this.isVueCallExpression(rootNode)
        ) {
            return;
        }

        // 若是，将template里面的字符串安装html进行解析，并跳过后续
        const code = this.parseHTMLInstance.parseCode(path.node.quasis[0].value.raw, this.scene);
        path.node.quasis = [
            t.templateElement({
                raw: code,
                cooked: code
            })
        ];
        path.skip();
        return {
            SKIP: true,
            HAS_CHANGE: this.parseHTMLInstance.hasChange
        }
    }
}

export default VueVisitor;