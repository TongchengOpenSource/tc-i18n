import assert from 'assert';
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
    primaryLocale: ['en-us', 'zh-cn'],
    framework: FRAMEWORK.VUE2,
}

const transformer = new Transformer(tci18nConfig);
describe('vue代码测试', () => {
    it('template解析innterText', async () => {
        const code = `<template>
<div>Hello world</div>
</template>`;
        const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.VUE);
        assert.ok(newCode.includes(`<div>{{$t('Hello world')}}</div>`));
    });
    it('template不解析属性', async () => {
        const code = `<template>
<div class="className">Hello world</div>
</template>`;
        const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.VUE);
        assert.ok(newCode.includes(`<div class="className">{{$t('Hello world')}}</div>`));
    });
    it('script解析字符串', async () => {
        const code = `<script>
export default {
  data() {
    return {
      name: "hi"
    };
  },
};
</script>`;
        const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.VUE);
        assert.ok(newCode.includes(`name: intl.$t("hi")`));
    });
    it('中文英文都提取', async () => {
        const code = `<template>
<div class="className">Hello world</div>
<div>你好</div>
</template>`;
        const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.VUE);
        assert.ok(newCode.includes(`<div>{{$t('你好')}}</div>`));
        assert.ok(newCode.includes(`<div class="className">{{$t('Hello world')}}</div>`));
    });
});
