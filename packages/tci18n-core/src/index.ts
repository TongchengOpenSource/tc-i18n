import Notify from 'notify';
import { FRAMEWORK, SOURCE_TYPE } from './constant';
import type { Tci18nConfig, Plugin } from 'types';
import ParseAST from './parseAST';
import type * as ParseASTType from './parseAST';
import Utils from './utils';

interface BeforeTransformTabType {
    transformCode: () => void;
    pluginLoaded: (plugins: Plugin[]) => void;
}

interface TransformingTabType {
    transformCode: (hook: ParseASTType.Hooks) => void;
}

interface AfterTransformTabType {
    transformCode: (code: string) => string;
}

export type Hooks = {
    beforeTransform: Notify<BeforeTransformTabType>,
    transforming: Notify<TransformingTabType>,
    afterTransform: Notify<AfterTransformTabType>,
}

let transformerInstance: Transformer;
class Transformer extends Utils {
    config: Tci18nConfig;
    parseAST?: ParseAST;
    source: string = '';
    originSourceType: string = '';
    sourceType: string & SOURCE_TYPE = SOURCE_TYPE.JS;
    scene?: string;
    hooks: Hooks;
    primaryLocaleData: Record<string, string> = {};
    errorData: {
        code: string,
        sourceType: string,
        scene: string,
        errorMessage?: string,
        error: any,
    }[] = [];
    pluginTransformMap: Record<string, SOURCE_TYPE> = {};
    plugins: Plugin[] = [];
    pluginLoadStatus: 'wait' | 'loading' | 'loaded' = 'wait';
    appliedPlugins: (Plugin|string)[] = [];
    extractOnly: boolean = false;

    constructor(config: Partial<Tci18nConfig>) {
        super();
        this.config = {
            entry: [],
            exclude: [],
            importCode: "",
            i18nObject: 'intl',
            i18nMethod: '$t',
            framework: FRAMEWORK.VUE2,
            ...config,
        };
        this.hooks = {
            beforeTransform: new Notify(),
            transforming: new Notify(),
            afterTransform: new Notify(),
        };
        this.loadPlugins();
    }

    get hookOptions() {
        return {
            code: this.source,
            sourceType: this.originSourceType,
            scene: this.scene,
            config: this.config,
        }
    }

    static getInstance(config: Tci18nConfig) {
        if (!transformerInstance) {
            transformerInstance = new Transformer(config);
        }
        return transformerInstance;
    }

    async loadPlugin(plugin: string | [string, object] | Plugin[]) {
        let pluginName = '';
        if (typeof plugin === 'object' && 'apply' in plugin) {
            return plugin;
        }
        if (typeof plugin === 'string') {
            pluginName = plugin;
        } else if (Array.isArray(plugin) && typeof plugin[0] === 'string') {
            pluginName = plugin[0];
        }
        const pluginPath = this.nodeModulesPath(pluginName);
        if (!this.existsSync(pluginPath)) {
            return Promise.reject(`${pluginName}插件不存在`);
        }
        const packageJson = JSON.parse(this.readFileSync(this.joinPath(pluginPath, 'package.json')));
        const isEsModule = packageJson.type === 'module';
        try {
            if (isEsModule) {
                return await import(pluginPath);
            }
            return require(pluginPath);
        } catch(e) {
            console.log(`=====${pluginName}插件加载错误=====`);
            console.log('错误信息：' + e);
            console.log('==========================');
        }
        return Promise.reject(`${pluginName}插件加载错误`);
    }

    async waitPluginLoaded(): Promise<Plugin[]> {
        return new Promise((resolve) => {
            this.hooks.beforeTransform.tap('pluginLoaded', (plugins) => {
                resolve(plugins);
            });
        });
    }

    /**
     * 加载插件
     */
    async loadPlugins() {
        this.pluginLoadStatus = 'loading';
        if (this.config.plugins) {
            for (let i = 0; i < this.config.plugins.length; i++) {
                let plugin = this.config.plugins[i];
                if (typeof plugin === 'string') {
                    const Plugin = await this.loadPlugin(plugin);
                    plugin = new Plugin();
                } else if (Array.isArray(plugin)) {
                    const [module, options] = plugin;
                    const Plugin = await this.loadPlugin(module);
                    plugin = new Plugin(options);
                }
                this.plugins.push(plugin as Plugin);
            }
        }
        this.hooks.beforeTransform.callByName('pluginLoaded', this.plugins);
        this.pluginLoadStatus = 'loaded';
    }

    matchSourceType(sourceTypeScope: Plugin['sourceTypeScope']) {
        let isMatch = false;
        if (!sourceTypeScope) {
            return true;
        }
        if (Array.isArray(sourceTypeScope)) {
            sourceTypeScope.forEach((typeScope) => {
                const [type, transformType] = typeScope.split(':').map((item) => item.trim());
                if (type === this.originSourceType) {
                    isMatch = true;
                }
                if (transformType) {
                    this.pluginTransformMap[type] = transformType as SOURCE_TYPE;
                }
            });
        } else if (sourceTypeScope instanceof Function) {
            const sourceType = sourceTypeScope(this.hookOptions);
            if (sourceType) {
                isMatch = true;
            }
            if (this.isObject(sourceType) && sourceType[this.originSourceType]) {
                Object.assign(this.pluginTransformMap, sourceType);
            }
        }
        return isMatch;
    }

    /**
     * 触发插件
     */
    applyPlugins() {
        this.plugins.forEach((plugin) => {
            if (
                this.matchSourceType(plugin.sourceTypeScope)
                && plugin.apply
            ) {
                if (plugin.name && this.appliedPlugins.includes(plugin.name)) {
                    return;
                } 
                if (this.appliedPlugins.includes(plugin)) {
                    return;
                }
                plugin.apply(this.hooks, this.hookOptions);
                if (plugin.name) {
                    this.appliedPlugins.push(plugin.name);
                } else {
                    this.appliedPlugins.push(plugin);
                }
            }
        })
    }

    /**
     * 转换源码
     * @param source 源码
     * @param sourceType 源码类型
     * @param scene 场景值
     * @returns 
     */
    async transformCode(
        source: string = '',
        sourceType: string,
        scene?: string
    ): Promise<{
        code: string,
        hasError: boolean,
        hasChange: boolean
    }> {
        if (this.pluginLoadStatus === 'wait') {
            // 先加载插件
            await this.loadPlugins();
        } else if (this.pluginLoadStatus === 'loading') {
            // 等待插件加载完成
            await this.waitPluginLoaded();
        }
        let hasError = false;
        this.source = source || '';
        this.scene = scene;
        this.originSourceType = sourceType;
        this.applyPlugins();
        try {
            this.sourceType = this.pluginTransformMap[sourceType] || sourceType;
            this.hooks.beforeTransform.callByName('transformCode', this.config);
            this.parseAST = new ParseAST(this.config, this.sourceType, this.scene);
            this.parseAST.extractOnly = this.extractOnly;
            this.hooks.transforming.callByName('transformCode', this.parseAST.hooks);
            let code = source;
            switch(this.sourceType) {
                case SOURCE_TYPE.VUE: code = this.transformVUE(source); break;
                case SOURCE_TYPE.TSX:
                case SOURCE_TYPE.TS: code = this.transformTS(source); break;
                case SOURCE_TYPE.WXS: code = this.transformWXS(source); break;
                case SOURCE_TYPE.JSX:
                case SOURCE_TYPE.JS: code = this.transformJS(source); break;
                case SOURCE_TYPE.WXML:
                case SOURCE_TYPE.HTML: code = this.transformHtml(source); break;
                default: throw new Error(`暂不支持${this.sourceType}的代码类型`);
            }
            this.primaryLocaleData = {
                ...this.primaryLocaleData,
                ...this.parseAST.primaryLocale,
            }
            code = this.hooks.afterTransform.callByNameAsFlow('transformCode', code);
            return {
                code,
                hasError,
                hasChange: this.parseAST.hasChange,
            };
        } catch(e: any) {
            console.log(`=====代码解析错误，返回原始值=====`);
            console.log('错误信息：' + e);
            console.log('==========================');
            hasError = true;
            this.errorData.push({
                code: source,
                sourceType,
                scene: this.scene || '',
                errorMessage: e.message || '',
                error: e,
            });
        }
        source = this.hooks.afterTransform.callByNameAsFlow('transformCode', source);
        return {
            code: source,
            hasError,
            hasChange: false,
        };
    }

    transformJS(code: string) {
        return this.parseAST?.parseJSCode(code) || code;
    }

    transformWXS(code: string) {
        return this.parseAST?.parseWXSCode(code) || code;
    }

    transformTS(code: string) {
        return this.parseAST?.parseTSCode(code) || code;
    }

    transformHtml(code: string) {
        return this.parseAST?.parseHTMLCode(code) || code;
    }

    transformVUE(code: string) {
        return this.parseAST?.parseVUECode(code) || code;
    }
}

export default Transformer;