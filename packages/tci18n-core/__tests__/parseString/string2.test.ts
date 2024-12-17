import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { SOURCE_TYPE, FRAMEWORK } from '../../src/constant/common';
import Transformer from '../../src/index';
import type { Tci18nConfig } from '../../types';

const tci18nConfig: Tci18nConfig = {
    entry: [],
    exclude: [],
    keyHasScene: false,
    extractOnly: false,
    ignoreComponents: [],
    ignoreMethods: [],
    ignoreAttrs: ['style'],
    ignoreStrings: [],
    importCode: "import { intl } from 'tci18n-vue2'",
    i18nMethod: '$t',
    i18nObject: 'intl',
    framework: FRAMEWORK.VUE2,
}

const transformer = new Transformer(tci18nConfig);
describe('字符串测试', () => {
    describe.skip('HTML模板', () => {
        it('html中带有单引号', async () => {
            const code = `<template>
        <div>'你好'</div>
    </template>`;
            const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.VUE);
            fs.writeFileSync(path.resolve(__dirname, './test.vue'), newCode);
            fs.writeFileSync(path.resolve(__dirname, './lang.json'), JSON.stringify(transformer.primaryLocaleData));
            assert.ok(newCode.includes(`<div>{{$t('\\'你好\\'')}}</div>`));
        });
        it('html中带有双引号', async () => {
            const code = `<template>
        <div>"你好"</div>
    </template>`;
            const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.VUE);
            fs.writeFileSync(path.resolve(__dirname, './test.vue'), newCode);
            fs.writeFileSync(path.resolve(__dirname, './lang.json'), JSON.stringify(transformer.primaryLocaleData));
            assert.ok(newCode.includes(`<div>{{$t('\\'你好\\'')}}</div>`));
        });
    });
    
    describe('Script模板', () => {
        it.skip('js中带有单引号', async () => {
            const code = `<script>
                const str = "'你好'";
            </script>`;
            const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.VUE);
            fs.writeFileSync(path.resolve(__dirname, './test.vue'), newCode);
            fs.writeFileSync(path.resolve(__dirname, './lang.json'), JSON.stringify(transformer.primaryLocaleData));
            assert.ok(newCode.includes(`const str = intl.$t("'你好'")`));
        });
        it.skip('js中带有转义单引号', async () => {
            const code = `<script>
                const str = "\'你好\'";
            </script>`;
            const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.VUE);
            fs.writeFileSync(path.resolve(__dirname, './test.vue'), newCode);
            fs.writeFileSync(path.resolve(__dirname, './lang.json'), JSON.stringify(transformer.primaryLocaleData));
            assert.ok(newCode.includes(`const str = intl.$t("'你好'")`));
        });
        it.skip('js中带有双引号', async () => {
            const code = `<script>
                const str = '"你好"';
            </script>`;
            const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.VUE);
            fs.writeFileSync(path.resolve(__dirname, './test.vue'), newCode);
            fs.writeFileSync(path.resolve(__dirname, './lang.json'), JSON.stringify(transformer.primaryLocaleData));
            assert.ok(newCode.includes(`const str = intl.$t("\\"你好\\"")`));
        });
        it.skip('js中带有转义双引号', async () => {
            const code = `<script>
                const str = '\"你好\"';
            </script>`;
            const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.VUE);
            fs.writeFileSync(path.resolve(__dirname, './test.vue'), newCode);
            fs.writeFileSync(path.resolve(__dirname, './lang.json'), JSON.stringify(transformer.primaryLocaleData));
            assert.ok(newCode.includes(`const str = intl.$t("\\"你好\\"")`));
        });
        it('js中带有换行符', async () => {
            const code = `<script>
                const str = '你好\\n世界';
            </script>`;
            const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.VUE);
            fs.writeFileSync(path.resolve(__dirname, './test.vue'), newCode);
            fs.writeFileSync(path.resolve(__dirname, './lang.json'), JSON.stringify(transformer.primaryLocaleData));
            assert.ok(newCode.includes(`const str = intl.$t("你好\\n世界")`));
        });
        it('js中带有制表符', async () => {
            const code = `<script>
                const str = '你好\\t世界';
            </script>`;
            const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.VUE);
            fs.writeFileSync(path.resolve(__dirname, './test.vue'), newCode);
            fs.writeFileSync(path.resolve(__dirname, './lang.json'), JSON.stringify(transformer.primaryLocaleData));
            assert.ok(newCode.includes(`const str = intl.$t("你好\\t世界")`));
        });
        it('js中带有回车符', async () => {
            const code = `<script>
                const str = '你好\\r世界';
            </script>`;
            const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.VUE);
            fs.writeFileSync(path.resolve(__dirname, './test.vue'), newCode);
            fs.writeFileSync(path.resolve(__dirname, './lang.json'), JSON.stringify(transformer.primaryLocaleData));
            assert.ok(newCode.includes(`const str = intl.$t("你好\\r世界")`));
        });
        it('测试vue', async () => {
            const code = `<script>
codeStr = \`module.export = {
    publishConfig: {
        projectId: 'pid',
        uploader: 'name黄家兴',
    }
}\`;
</script>`;
            const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.VUE);
            fs.writeFileSync(path.resolve(__dirname, './test.vue'), newCode);
            fs.writeFileSync(path.resolve(__dirname, './lang.json'), JSON.stringify(transformer.primaryLocaleData));
            assert.ok(newCode.includes(`const str = intl.$t("你好\\r世界")`));
        });
        it('', async () => {
            const code = `const obj = {
      slots: {
        default: (data) => {
          return (
              <el-button >
                  编辑
              </el-button>)
    
        }
      }
    }`
            const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.TS);
            fs.writeFileSync(path.resolve(__dirname, './test.vue'), newCode);
            fs.writeFileSync(path.resolve(__dirname, './lang.json'), JSON.stringify(transformer.primaryLocaleData));
            assert.ok(newCode.includes(`[intl.$t("黄家兴")]: 'Huang Jiaxing'`));
        })
    });
});
