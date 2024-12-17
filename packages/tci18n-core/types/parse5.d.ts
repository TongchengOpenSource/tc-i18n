
export type ParseLocation = {
    endCol: number;
    endLine: number;
    endOffset: number;
    startCol: number;
    startLine: number;
    startOffset: number;
}

export type ParseAttribute = {
    name: string;
    value: string;
}

export type ParseNode = {
    nodeName: string;
    sourceCodeLocation: ParseLocation & { endTag: ParseLocation, startTag: ParseLocation} | null;
    parentNode: ParseTagNode | null;
}

export type ParseTextNode = {
    value: string;
    nodeName: '#text';
} & ParseNode;

export type ParseCommentNode = {
    data: string;
    nodeName: '#comment';
} & ParseNode;

export type ParseFragmentNode = {
    nodeName: '#document-fragment';
    childNodes: ParseChildNode[];
} & ParseNode;

export type ParseTemplateNode = {
    namespaceURI: string;
    nodeName: 'template';
    content: ParseFragmentNode;
} & ParseNode;

export type ParseChildNode = ParseTagNode | ParseTextNode | ParseCommentNode | ParseTemplateNode;

export type ParseTagNode = {
    tagName: string;
    attrs: ParseAttribute[];
    childNodes: ParseChildNode[];
    namespaceURI: string;
} & ParseNode;

export type ParseRootNode = {
    childNodes: [ParseHtmlNode];
    mode: 'quirks';
    nodeName: '#document';
}

export type ParseHtmlNode = {
    tagName: 'html';
    nodeName: 'html';
    childNodes: [ParseHeadNode, ParseBodyNode];
} & ParseTagNode;

export type ParseHeadNode = {
    tagName: 'head';
    nodeName: 'head';
} &  ParseTagNode;

export type ParseBodyNode = {
    tagName: 'body';
    nodeName: 'head';
} & ParseTagNode;

export as namespace parse5;