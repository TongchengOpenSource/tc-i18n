import { Plugin } from './plugin';
import { FRAMEWORK } from '../src/constant';

type KeyHasScene = boolean | string[] | {value?: string, filePath?: string}[]

interface PublishConfig {
    projectId: string,
    uploader?: string,
    isDebug?: boolean
}

export type Framework = FRAMEWORK;

export interface Tci18nConfig {
    entry: string[], // 入口文件
    exclude: string[], // 排除文件
    keyHasScene?: KeyHasScene, // key是否包含场景值
    extractOnly?: boolean, // 是否只提取语料不替换源码
    ignoreComponents?: string[], // 忽略组件
    ignoreMethods?: string[], // 忽略方法
    ignoreAttrs?: string[], // 忽略属性
    ignoreStrings?: Array<string | RegExp>, // 忽略字符串
    ignoreAST?: any, // 忽略AST
    importCode: string, // 引入代码
    i18nObject: string; // i18n对象
    i18nMethod: string, // i18n方法
    publishConfig?: PublishConfig, // 发布配置
    framework: Framework, // 框架
    purePrimaryLocale?: string | RegExp | boolean, // 纯净主语言
    primaryLocale?: string; // 主语言
    templateKeyWords?: string[], // 模板关键字
    plugins?: string[] | [string, object][] | Plugin[], // 插件
    output?: string, // 输出目录
    debug?: boolean,
    isDecorator?: boolean
}