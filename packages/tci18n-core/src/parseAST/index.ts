import { SOURCE_TYPE } from 'src/constant';
import type { Tci18nConfig } from 'types';
import ParseJS from './parseJS';
import type * as ParseJSType from './parseJS';
import ParseHTML from './parseHTML';
import type * as ParseHTMLType from './parseHTML';
import ParseVUE from './ParseVUE';
import type * as ParseVueType from './ParseVUE';
import Utils from 'src/utils';

export type Hooks = {
    parseHTML: ParseHTMLType.Hook;
    parseJS: ParseJSType.Hook;
    parseVUE: ParseVueType.Hook;
}
class ParseAST extends Utils {
    config: Tci18nConfig;
    sourceType: SOURCE_TYPE;
    scene?: string;
    parseJS: ParseJS;
    parseHTML: ParseHTML;
    parseVUE: ParseVUE;
    hooks: Hooks;
    extractOnly: boolean = false;
    constructor(
        config: Tci18nConfig,
        sourceType: SOURCE_TYPE,
        scene?: string
    ) {
        super();
        this.config = { ...config };
        this.scene = scene;
        this.sourceType = sourceType;
        this.parseHTML = new ParseHTML(
            this.config,
            this.sourceType,
            this.scene,
        );
        this.parseHTML.extractOnly = this.extractOnly;
        this.parseJS = new ParseJS(
            this.config,
            this.sourceType,
            this.scene,
        );
        this.parseJS.extractOnly = this.extractOnly;
        this.parseVUE = new ParseVUE(
            this.config,
            this.sourceType,
            this.scene,
        );
        this.parseVUE.extractOnly = this.extractOnly;
        this.hooks = {
            parseHTML: this.parseHTML.hooks,
            parseJS: this.parseJS.hooks,
            parseVUE: this.parseVUE.hooks,
        };
    }

    get hasChange() {
        return this.parseHTML.hasChange || this.parseJS.hasChange || this.parseVUE.hasChange;
    }

    get primaryLocale() {
        return {
            ...this.parseHTML.primaryLocale,
            ...this.parseJS.primaryLocale,
            ...this.parseVUE.primaryLocale,
        }
    }

    /**
     * 解析JS代码
     */
    parseJSCode(code: string) {
        this.parseJS.isTS = false;
        const newCode = this.parseJS.parseCode(code, this.scene);
        return newCode;
    }

    /**
     * 解析JS代码
     */
    parseWXSCode(code: string) {
        let relativePath = '';
        this.parseJS.needImport = false;
        if (this.scene) {
            relativePath = this.formatPath(this.relativePath(this.dirnamePath(this.scene), 'tci18n.wxs'));    
        }
        const cancelTab = this.parseJS.hooks.parsed.tap('parseCode', (code) => {
            return  `var intl = require("${relativePath}");
var locale;
function setLocale(lo) {locale = lo};
module.exports.setLocale = setLocale;
${code}`;
        });
        const newCode = this.parseJS.parseCode(code, this.scene);
        cancelTab();
        return newCode;
    }

    /**
     * 解析TS代码
     */
    parseTSCode(code: string) {
        this.parseJS.isTS = true;
        const newCode = this.parseJS.parseCode(code, this.scene);
        return newCode;
    }

    /**
     * 解析html代码
     */
    parseHTMLCode(code: string) {
        const newCode = this.parseHTML.parseCode(code, this.scene);
        return newCode;
    }

    /**
     * 解析vue代码
     */
    parseVUECode(code: string) {
        const newCode = this.parseVUE.parseCode(code, this.scene);
        return newCode;
    }
}

export default ParseAST;