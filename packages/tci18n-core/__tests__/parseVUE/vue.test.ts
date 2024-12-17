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
describe('vue代码测试', () => {
    it('template解析', async () => {
        const code = `<template>
    <div>你好</div>
</template>`;
        const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.VUE);
        assert.ok(newCode.includes(`<div>{{$t('你好')}}</div>`));
    });
    it('script解析', async () => {
        const code = `<script>
        let name = '你好';
        </script>`;
        const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.VUE);
        assert.ok(newCode.includes(`import { intl } from "tci18n-vue2"`));
        assert.ok(newCode.includes(`let name = intl.$t("你好");`));
    });
    it('ts类型的script解析', async () => {
        const code = `<script lang="ts">
        let name:string = '你好';
        </script>`;
        const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.VUE);
        assert.ok(newCode.includes(`import { intl } from "tci18n-vue2"`));
        assert.ok(newCode.includes(`let name: string = intl.$t("你好");`));
    });
    it('setup + ts类型的script解析', async () => {
        const code = `<script lang='ts' setup>
        let name:string = '你好';
        </script>`;
        const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.VUE);
        assert.ok(newCode.includes(`import { intl } from "tci18n-vue2"`));
        assert.ok(newCode.includes(`let name: string = intl.$t("你好");`));
    });
    it('完整vue代码解析', async () => {
        const code = `<template>
    <div class="name">你好</div>
    <input placeholder="请输入"/>
</template>
<script lang='ts' setup>
    let name:string = '你好';
</script>
<style>
.name {
    font-family: '微软雅黑';
}
</style>`;
        const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.VUE);
        assert.ok(newCode.includes(`import { intl } from "tci18n-vue2"`));
        assert.ok(newCode.includes(`let name: string = intl.$t("你好");`));
    });
    it('template属性解析', async () => {
        const code = `Vue.component('dialog', {
            template: '<div>你好呀</div>'
        })`;
        const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.JS);
        assert.ok(newCode.includes(`template: "<div>{{$t('你好呀')}}</div>"`));
    });
    it.skip('自动注入标记', async () => {
        const code = `<template>
    <div>你好{{true ? '中国' : '日本'}}</div>
</template>`;
        const transformer = new Transformer({
            ...tci18nConfig,
            keyHasScene: true,
        });
        const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.VUE, 'test.vue');
        assert.ok(newCode.includes(`data-tci18n-key`));
        assert.ok(newCode.includes(`data-tci18n`));
    });
    it('解析vue文件', async () => {
        const transformer = new Transformer({
            ...tci18nConfig,
            framework: FRAMEWORK.VUE3,
        });
        const code = fs.readFileSync(path.resolve(__dirname, './test.vue'), { encoding: 'utf-8' });
        const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.VUE, 'test.vue');
        assert.ok(newCode !== code);
    });
    it('去掉js解析后前面的分号', async () => {
        const code = `
        <template>
            <el-text
                size="small"
                class="mg-r_2"
                plain
            >
                你好
                {{ (projectData.managersList || []).slice(0, 4).map((item: any) => item.userName).join(',') }}
            </el-text>
        </template>
        <script lang="ts"></script>
        `;
        const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.VUE, 'test.vue');
        assert.ok(newCode.includes(`{{(projectData.managersList || [])
  .slice(0, 4)
  .map((item: any) => item.userName)
  .join(',')}}`));
    });
    it('不能重复添加modify标注', async () => {
        const code = `<template>
            <div class="primary-bg h_30 w-full z-index_10 flex flex-center" style="color: white;">
                原美杜莎平台正式更新为 <b class="mg-l_10 fs-md">贴心小译平台</b>，期待未来更贴心的赋能～
            </div>
        </template>`;
        const { code: newCode, hasError } = await transformer.transformCode(code, SOURCE_TYPE.VUE, 'test.vue');
        assert.ok(!hasError);
    });
    it('忽略console.log', async () => {
        const code = `<template>
            <div>你好</div>
        </template>
        <script>
            console.log('中国');
        </script>`;
        const transformer = new Transformer({
            ...tci18nConfig,
            extractOnly: false,
            // ignoreMethods: ['console.log'],
        });
        const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.VUE, 'test.vue');
        assert.ok(newCode.includes(`console.log('中国');`));
    });
    it('解析动态数据里面的对象', async () => {
        const code = `<template>
            <div :style="{
                    width: commentVisible ? '277px' : 'unset',
                    marginRight: commentVisible ? '-10px' : 'unset' //因为右侧padding改为了35px
                }">
            </div>
        </template>
        `;
        const { code: newCode, hasError } = await transformer.transformCode(code, SOURCE_TYPE.VUE, 'test.vue');
        assert.ok(!hasError);
    });
    it('部分中文提取缺失', async () => {
        const code = `<template>
  <p>
    其他({{ i.webRoomLength }}间)
  </p>
</template>`;
        const { code: newCode, hasError } = await transformer.transformCode(code, SOURCE_TYPE.VUE, 'test.vue');
        assert.ok(!hasError);
    })
    it('template中有ts', async () => {
        const code = `<template>
    <span>{{ scoreEnum[row.qualityResult as keyof typeof scoreEnum] }}</span>
</template>
<script lang="ts"></script>`;
        const { code: newCode, hasError } = await transformer.transformCode(code, SOURCE_TYPE.VUE, 'test.vue');
        assert.ok(!hasError);
    })
});

describe('vue代码测试', () => {
    it('测试', async () => {
        const code = fs.readFileSync(path.resolve(__dirname, './test2.vue'), 'utf-8');
        const { code: newCode, hasError } = await transformer.transformCode(code, SOURCE_TYPE.VUE, 'src/views/book-mgt/book-list/index.vue');
        console.log(newCode);
    });
})
