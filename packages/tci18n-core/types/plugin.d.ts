// import Transformer from '../src/index';
import type * as TType from '@babel/types';
import type * as parse5 from 'parse5';
import type { Hooks } from '../src/index';
import type * as ParseAST from '../src/parseAST';
import type { Tci18nConfig, SOURCE_TYPE } from './index';

export type PluginOptions = {
    code: string,
    sourceType: string,
    scene?: string,
    config: Tci18nConfig,
};

export interface Plugin {
    name?: string;
    exts?: string[];
    sourceTypeScope?: string[] | ((options: PluginOptions) => void | boolean | Record<string, SOURCE_TYPE | undefined>); // 作用的代码类型
    apply: (transformer: Hooks, options: PluginOptions) => void;
}

export type HookReturn = {
    SKIP?: boolean;
    HAS_CHANGE?: boolean;
    HAS_IMPORT?: boolean;
}

export type Parser = ParseAST.Hooks;

export type Config = Tci18nConfig;

export type Transformer = Hooks;

export type BabelT = typeof TType;

export as namespace tci18nPlugin;