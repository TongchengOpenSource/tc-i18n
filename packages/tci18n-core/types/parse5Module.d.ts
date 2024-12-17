declare module 'parse5' {
    export function parse(html: string, options: any): parse5.ParseRootNode;
}


declare module 'parse5/serializer' {
    export default class Serializer {
        public treeAdapter: any;
        public html: string;
        constructor(ast: any, options?: any);
        public serialize(): string;
    }
}
