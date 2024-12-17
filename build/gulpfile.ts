import Tci18nCliBuilder from './packageBuilders/tci18nCliBuilder';
import Tci18nCoreBuilder from './packageBuilders/tci18nCoreBuilder';
import Tci18nVue2Builder from './packageBuilders/tci18nVue2Builder';
import Tci18nVue3Builder from './packageBuilders/tci18nVue3Builder';
import Tci18nReactBuilder from './packageBuilders/tci18nReactBuilder';
import Tci18nIntlBuilder from './packageBuilders/tci18nIntlBuilder';
import Tci18nShareBuilder from './packageBuilders/tci18nShareBuilder';
import Tci18nMiniprogramBuilder from './packageBuilders/tci18nMiniprogramBuilder';
import Tci18nPluginBuilder from './pluginBuilders/tci18nPluginBuilder';

class Builder {
    async build(type: string) {
        console.log(type);
        const strategy: {[key in string]: Function} = {
            cli: this.buildCli,
            core: this.buildCore,
            vue2: this.buildTci18nVue2,
            vue3: this.buildTci18nVue3,
            react: this.tci18nReactBuilder,
            intl: this.tci18nIntlBuilder,
            tci18nPlugin: this.builderTci18nPlugin,
            share: this.buildSharePlugin,
            mini: this.builderMiniprogram
        };
        if (strategy[type] instanceof Function) {
            await strategy[type]();
        }
    }

    async buildCli() {
        const builder = new Tci18nCliBuilder();
        await builder.build();
    }

    async buildCore() {
        const builder = new Tci18nCoreBuilder();
        await builder.build();
    }

    async buildTci18nVue2() {
        const builder = new Tci18nVue2Builder();
        await builder.build();
    }

    async buildTci18nVue3() {
        const builder = new Tci18nVue3Builder();
        await builder.build();
    }

    async tci18nReactBuilder() {
        const builder = new Tci18nReactBuilder();
        await builder.build();
    }

    async tci18nIntlBuilder() {
        const builder = new Tci18nIntlBuilder();
        await builder.build();
    }

    async buildSharePlugin() {
        const builder = new Tci18nShareBuilder();
        await builder.build();
    }

    async builderTci18nPlugin() {
        const builder = new Tci18nPluginBuilder();
        await builder.build();
    }

    async builderMiniprogram() {
        const builder = new Tci18nMiniprogramBuilder();
        await builder.build();
    }
}

const build = new Builder();
export default async () => {
    await build.build(process.env.NODE_ENV as string)   
}