
import transform from '../src/index';
import { SOURCE_TYPE, FRAMEWORK } from '../src/constant';

export * from '../src/constant';
export * from './config';
export * from './plugin';
export * from './parse5';

export default transform;

declare module '@tc-i18n/core' {
    type CONSTANT = {
        SOURCE_TYPE: typeof SOURCE_TYPE,
        FRAMEWORK: typeof FRAMEWORK
    };
    export const CONSTANT: CONSTANT;
    export const ParseAST: typeof import('../src/parseAST').default;
    export const ParseJS: typeof import('../src/parseAST/parseJS').default;
    export const ParseHTML: typeof import('../src/parseAST/parseHTML').default;
    export const ParseVUE: typeof import('../src/parseAST/ParseVUE').default;
    export const Utils: typeof import('../src/utils').default;
}