import { SOURCE_TYPE } from 'src/constant';
import type { Tci18nConfig } from 'types';
import Utils from 'src/utils';

abstract class BaseParse extends Utils {
    config: Tci18nConfig;
    sourceType: SOURCE_TYPE;
    scene?: string;
    primaryRegx: RegExp = /[\u4e00-\u9fa5]/;
    primaryRegxMap: Record<string, RegExp> = {
        'zh-cn': /[\u4e00-\u9fa5]/,
        'en-us': /[a-zA-Z]/,
    };
    filterMatch: RegExp[] = [
        /^https?:/, // 网络地址
        /\.(jpg|jpeg|png|gif|bmp|txt|pdf|doc|docx|xls|xlsx|ppt|pptx)$/, // 常见文件
    ];
    /**
     * 是否有匹配的字符串
     */
    hasPrimary?: boolean;
    static keyMap = new Map<string, Map<string, Array<string>>>();
    primaryLocaleData: Record<string, string> = {};
    modifyMark: string = 'data-tci18n';
    modifyMarkKey: string = 'data-tci18n-key';
    modifyMarkName: string = 'data-tci18n-name';
    constructor(
        config: Tci18nConfig,
        sourceType: SOURCE_TYPE,
        scene?: string,
    ) {
        super();
        this.config = { ...config };
        this.scene = scene;
        this.sourceType = sourceType;
    }

    /**
     * 是否存在需要提取的字符串
     * @param str 字符串
     * @returns 
     */
    isPrimary(str: string = '', type?: string) {
        /**
         * 存在的type类型
         * parseAttrs，parseInnerText
         * parseWxmlAttr，parseInnerText
         * parseAttr，Identifier
         * DirectiveLiteral， TemplateLiteral
         * StringLiteral，JSXText
         * ObjectExpression
         */
        const matchSingle = (locale = 'zh-cn') => {
            if (type) {
                // 主语言是英文，则只提取部分
                if (
                    locale === 'en-us' &&
                    ![
                        'parseInnerText',
                        'TemplateLiteral',
                        'StringLiteral',
                        'JSXText',
                    ].includes(type)
                ) {
                    return false;
                }
            }
            const primaryRegx = this.primaryRegxMap[locale] || this.primaryRegx;
            const isMatch = primaryRegx.test(str);
            if (isMatch) {
                // 匹配
                if (this.filterMatch.some(reg => reg.test(str))) {
                    // 过滤掉图片地址等
                    return false;
                }
                this.hasPrimary = true;
                return true;
            }
            return false;
        }
        if (Array.isArray(this.config.primaryLocale)) {
            return this.config.primaryLocale.some((locale) => matchSingle(locale))
        }
        return matchSingle(this.config.primaryLocale);
    }

    /**
     * 是否只存在需要提取的字符串
     */
    isPurePrimary(str: string) {
        const matchSingle = (locale = 'zh-cn') => {
            const primaryRegx = this.primaryRegxMap[locale] || this.primaryRegx;
            const regStr = primaryRegx.source.slice(1, primaryRegx.source.length - 1)
            const pureRegExp = new RegExp(`^[${regStr}]+$`);
            const isMatch = pureRegExp.test(str);
            if (isMatch) {
                this.hasPrimary = true;
                return true;
            }
            return false;
        }
        if (Array.isArray(this.config.primaryLocale)) {
            return this.config.primaryLocale.some((locale) => matchSingle(locale))
        }
        return matchSingle(this.config.primaryLocale);
    }

    /**
     * 格式化键值，将键值中的制表符等转义
     * @param value 键值
     * @returns 
     */
    formatValue(value: string) {
        return value.replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t')
            .replace(/\\r/g, '\r')
    }

    formatCode(code: string) {
        return code.replace(/\n/g, '\\n')
        .replace(/\t/g, '\\t')
        .replace(/\r/g, '\\r')
    }

    /**
     * 格式化代码中的键名，
     * @param key 存在代码中的键名，需要跟json中的键名保持一致
     * @returns 
     */
    formatKey(key: string) {
        // return key.replace(/\n/g, '\\n')
        //     .replace(/\t/g, '\\t')
        //     .replace(/\r/g, '\\r')
        //     .replace(/"/g, '\\"')
        //     .replace(/ /g, '');
        return key.replace(/\s/g, '').trim();
    }

    formatKeyForAttr(key: string) {
        return key.trim().replace(/"/g, '\\"').replace(/'/g, "\\'");
    }

    /**
     * 格式化json中的键名
     * @param key 存在json中的键名，需要跟代码中的键名保持一致
     * @returns 
     */
    formatJSONKey(key: string) {
        return key.replace(/\\"/g, '\"')
            .replace(/\\'/g, "\'")
            .replace(/\\n/g, "\n")
            .replace(/\\t/g, "\t")
            .replace(/\\r/g, "\r")
            .replace(/ /g, '');
    }

    collectKey(key: string, value?: string) {
        this.primaryLocaleData[key] = value || key;
    }

    /**
     * 生成键名
     * @param keyValue 键名
     * @returns 
     */
    makeKey(keyValue: string, isAttr = false) {
        const key = this.connectKey(isAttr ? this.formatKeyForAttr(keyValue) : this.formatKey(keyValue));
        this.collectKey(this.formatJSONKey(key), this.formatValue(keyValue));
        return key;
    }

    /**
     * 拆分键名，通过键名获取各部分值
     * @param key 键名
     * @returns 
     */
    splitKey(key: string) {
        if (key.indexOf('#!!!#') > -1) {
            const [value, filePathIndex] = key.split('#!!!#')
            let filePath = ''
            let index = ''
            if (filePathIndex) {
                const splitIndex = filePathIndex.lastIndexOf('_')
                filePath = filePathIndex.slice(0, splitIndex)
                index = filePathIndex.slice(splitIndex + 1)
            }
            return [value, filePath, index]
        }
        return [key, '', '']
    }
    
    /**
     * 通过值创建键名
     * @param value 值
     * @returns 
     */
    connectKey(value: string) {
        // value = value.replace(/"/g, '\'');
        [value] = this.splitKey(value);
        const { keyHasScene } = this.config;
        const valueArr = this.collectKeyMap(value);
        if (!keyHasScene || !this.scene) {
            return value
        }
        let isMatch = !!keyHasScene;
        if (Array.isArray(keyHasScene)) {
            isMatch = keyHasScene.some((sceneItem) => {
                if (typeof sceneItem === 'string') {
                    return sceneItem === value;
                }
                if (typeof sceneItem === 'object') {
                    const { value: sceneValue, filePath: sceneFilePath } = sceneItem;
                    let match = false;
                    sceneValue && (match = value === sceneValue)
                    sceneFilePath && (match = this.scene === sceneFilePath)
                    return match;
                }
            });
        }
        if (!isMatch) {
            return value
        }
        return `${value}#!!!#${this.scene}_${valueArr!.length}`
    }

    collectKeyMap(value: string) {
        const [pureValue] = this.splitKey(value);
        const scene = this.scene || 'COMMON';
        if (!BaseParse.keyMap.has(scene)) {
            BaseParse.keyMap.set(scene, new Map());
        }
        const valueMap = BaseParse.keyMap.get(scene);
        if (!valueMap!.has(pureValue)) {
            valueMap!.set(pureValue, []);
        }
        const valueArr = valueMap!.get(pureValue);
        valueArr!.push(pureValue);
        return valueArr;
    }

    ignoreStrings(str: string) {
        const defaultIgnoreStrings = [];
        const ignoreStrings = [...(this.config.ignoreStrings || []), ...defaultIgnoreStrings];
        if (ignoreStrings.length === 0) {
            // 没有配置忽略字符串
            return false;
        }
        return ignoreStrings.some((ignore) => {
            if (ignore instanceof RegExp) {
                return ignore.test(str);
            }
            if (typeof ignore === 'string' && ignore.startsWith('^')) {
                // 因为JSON中不能直接写正则表达式，如果是^开头则说明是正则
                const regexp = new RegExp(ignore.slice(1));
                return regexp.test(str)
            }
            return ignore === str;
        })
    }

    ignoreMethods(methodName: string) {
        const defaultIgnoreMethods = ['console.log', 'console.error', 'console.warn', 'console.info', 'console.debug'];
        const ignoreMethods = [...(this.config.ignoreMethods || []), ...defaultIgnoreMethods];
        return ignoreMethods.includes(methodName.trim());
    }

    ignoreComponents(componentName: string) {
        const defaultIgnoreComponents = [];
        const ignoreComponents = [...(this.config.ignoreComponents|| []), ...defaultIgnoreComponents];
        return ignoreComponents.includes(componentName.trim());
    }

    ignoreAttrs(attrName: string) {
        const defaultIgnoreAttrs = ['class', 'style', 'id', 'data-url', 'navigateTo', this.modifyMark, this.modifyMarkKey, this.modifyMarkName];
        const ignoreAttrs = [...(this.config.ignoreAttrs || []), ...defaultIgnoreAttrs];
        return ignoreAttrs.includes(attrName.trim());
    }
}

export default BaseParse;