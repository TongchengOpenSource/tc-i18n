
import prettier from 'prettier';
import { FRAMEWORK, SOURCE_TYPE } from 'src/constant';
import type { Tci18nConfig } from 'types';
import BaseParse from '../../BaseParse';
import { Hook} from '../index';
import ParseJS from '../../parseJS';

class VueParser extends BaseParse {
    config: Tci18nConfig;
    sourceType: SOURCE_TYPE;
    scene?: string;
    parseJS?: ParseJS;
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
            this.parseJS.needI18nObject = false;
        }
        return this.parseJS;
    }

    /**
     * 插件加载函数，必须
     * @param hook 
     * @returns 
     */
    load(hook: Hook, extractOnly?: boolean) {
        this.extractOnly = extractOnly || false;
        const { framework } = this.config;
        if (![FRAMEWORK.VUE2, FRAMEWORK.VUE3, FRAMEWORK.HTML].includes(framework)) {
            return;
        }
        hook.parsing.parseHTML.tap('parseAttr', this.parseAttr.bind(this));
    }

    parseAttr(node: parse5.ParseTagNode, attr: parse5.ParseAttribute) {
        if (!this.isPrimary(attr.value, 'parseAttr')) {
            return;
        }
        let newValue = attr.value;
        let hasChange = false;
        if (
            attr.name.startsWith('v-')
            || attr.name.startsWith(':')
            || attr.name.startsWith('@')
            || attr.name.startsWith('on')
        ) {
            // 内容可直接按照js处理
            newValue = this.parseAsJs(attr.value);
            newValue = newValue.trim();
            if (newValue.startsWith(';')) {
                newValue = newValue.slice(1);
            }
            if (this.parseJSInstance.hasChange && !this.extractOnly) {
                attr.value = newValue;
                hasChange = this.parseJSInstance.hasChange;
            }
            return {
                SKIP: true,
                HAS_CHANGE: hasChange,
            }
        }
    }

    parseAsJs(code: string) {
        let newCode = code;
        try {
            newCode = this.parseJSInstance.parseCode(code, this.scene);
            return prettier.format(newCode, {
                parser: 'babel',
                singleQuote: true,
                semi: false,
                printWidth: 10000000,
            }).replace(/\s*$/, '');
        } catch(e1) {
            try {
                newCode = this.parseJSInstance.parseCode(`(${code})`, this.scene);
                newCode = newCode.slice(1, newCode.length - 2);
            } catch(e: any){
                throw e;
            }
        }
        return newCode;
    }
}

export default VueParser;