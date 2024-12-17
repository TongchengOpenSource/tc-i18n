import { rollup, watch } from 'rollup';
import fs from 'fs';
import type { RollupOptions, OutputOptions, RollupBuild } from 'rollup';

class BaseBuilder {
    constructor() {
    }

    /**
     * rollup构建器
     * @param option rollup参数
     */
    protected async rollup(inputOptions: RollupOptions, outputOptions: OutputOptions[] = []) {
        const bundle = await rollup(inputOptions);
        await this.writeBundles(bundle, outputOptions);
    }

    watchRollup(inputOptions: RollupOptions, outputOptions: OutputOptions[] = []) {
        return watch({
            ...inputOptions,
            output: outputOptions,
            watch: {}
        });
    }

    /**
     * 写入bundles
     * @param bundle bundle实例
     * @param options 输出配置
     * @returns 
     */
    writeBundles(bundle: RollupBuild, options: OutputOptions[] = []) {
        console.log(options);
        return Promise.all(options.map(bundle.write));
    }

    deleteFolder(folder: string) {
        if (fs.existsSync(folder)) {
          fs.rmdirSync(folder, { recursive: true });
        }
    }
}

export default BaseBuilder;