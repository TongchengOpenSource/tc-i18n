# @tc-i18n 国际化工具

### 简介

#### 什么是@tc-i18n

##### 背景

`@tc-i18n` 最初目的是为了解决传统老项目国际化改造难的问题，按照一般的国际化改造，需要手动去提取代码中的文案，并且利用`vue-i18n`或`react-intl`等三方库来实现国际化，整个过程比较好费开发人员的精力，从而提出了新的国际化改造思路。

##### 概述

`@tc-i18n`是利用AST对源代码进行解析，通过配置识别出代码中的文案语料，然后自动进行文案提取和转换，配合提供的一些列插件从而实现在不改变源码，保持原来开发习惯下让项目拥有国际化能力。

##### 特性

- 母语开发，无需使用`$t`函数

- 采用`Monorepo`架构，可以独立使用各个功能模块

- 命令行工具实现语料自动化提取，代码自动化转换
- 支持`js`，`ts`，`jsx`，`tsx`，`vue`文件解析
- 丰富的配置项，自定义提取逻辑
- 支持插件扩展，插拔使用
- 支持编译时转换，可以不影响本地源文件代码

#### 快速开始

##### 安装

> 最低支持node12

项目根目录下安装`@tc-i18n/cli`脚手架工具和`@tc-i18n/build-plugin`构建插件

```shell
npm install @tc-i18n/cli @tc-i18n/build-plugin -D
```

然后根据项目框架分别安装框架插件

**vue2**

```shell
npm install @tc-i18n/vue2 -D
```

**vue3**

```shell
npm install @tc-i18n/vue3 -D
```

**React**

```shell
npm install @tc-i18n/react -D
```

**微信小程序**

```shell
npm install @tc-i18n/mini-miniprogram -D
```



### 使用

#### 构建器部分

##### webpack

在webpack的配置文件中使用插件

```js
import { Webpack3Tci18nPlugin, WebpackTci18nPlugin } from '@tc-i18n/build-plugin';

module.export = {
  ...
  plugins: [
    Webpack3Tci18nPlugin(),  // webpack2/3使用
    WebpackTci18nPlugin(),  // webpack4/5使用
  ]
}
```

##### Vite

在vite的配置文件中使用插件

```js
import { ViteTci18nPlugin } from '@tc-i18n/build-plugin';

export default () => {
  return {
    ...
    plugins: [
      ViteTci18nPlugin(),
    ]
  }
}
```

#### 框架部分

##### VUE2

1. 在项目根目录下执行`init`命令初始化

   ```shell
   npx tc-i18n init
   ```

   选择 **VUE2**

   <!--插入cmd截图-->

   执行完成后会在根目录下生成  **tci18n.config.json** 文件

2. 执行 `transform`命令，提取语料

   ```shell
   npx tc-i18n transform
   ```

   执行完成后，会讲语料提取到根目录下的 **locale/langs.json** 文件中，如下

   <!--插入语料文件截图-->

3. 注册框架插件

   ```js
   import tci18nVue from '@tc-i18n/vue2';
   
   Vue.use(tci18nVue, {
     locale: 'en-us', // 当前显示语种，可根据自己切换语种方式指定具体的语种
     langs: {  // 当前语料数据，通过对transform提取出来的语料进行翻译后得到
       en-us: {}
     },
   })
   ```

##### VUE3

1. 在项目根目录下执行`init`命令初始化

   ```shell
   npx tc-i18n init
   ```

   选择 **VUE3**

   <!--插入cmd截图-->

   执行完成后会在根目录下生成  **tci18n.config.json** 文件

2. 执行 `transform`命令，提取语料

   ```shell
   npx tc-i18n transform
   ```

   执行完成后，会讲语料提取到根目录下的 **locale/langs.json** 文件中，如下

   <!--插入语料文件截图-->

3. 注册框架插件

   ```js
   import { createApp } from 'vue';
   import tci18nVue from '@tc-i18n/vue3';
   
   const app = createApp();
   app.use(tci18nVue, {
     locale: 'en-us', // 当前显示语种，可根据自己切换语种方式指定具体的语种
     langs: {  // 当前语料数据，通过对transform提取出来的语料进行翻译后得到
       en-us: {}
     },
   });
   ```

##### REACT

1. 在项目根目录下执行`init`命令初始化

   ```shell
   npx tc-i18n init
   ```

   选择 **React**

   <!--插入cmd截图-->

   执行完成后会在根目录下生成  **tci18n.config.json** 文件

2. 执行 `transform`命令，提取语料

   ```shell
   npx tc-i18n transform
   ```

   执行完成后，会讲语料提取到根目录下的 **locale/langs.json** 文件中，如下

   <!--插入语料文件截图-->

3. 注册框架插件

   ```js
   import tci18nReact from '@tc-i18n/react';
   tci18nReact({
     locale: 'en-us', // 当前显示语种，可根据自己切换语种方式指定具体的语种
     langs: {  // 当前语料数据，通过对transform提取出来的语料进行翻译后得到
       en-us: {}
     },
   })
   ```

##### 微信小程序

由于微信小程序的构建过程由微信开发工具执行，所以为了不影响本地源文件代码，采用的方案是由`@tc-i18n ` 生成转换后完整的项目文件，然后新的项目文件放到微信开发工具中运行上传即可。

1. 调整 **tci18n.config.json**配置文件

   ```json
   {
     ...
     output: 'dist', // 制定输出的项目文件夹目录
   }
   ```

2. 微信小程序使用 `globalThis.__tci18n_local__`和`globalThis.__tci18n_lang__`来指定当前语种和语料资源，对语料资源翻译好后，需要在 **app.js**中进行初始化

   ```js
   globalThis.__tci18n_locale__ = 'en-us';  // 当前显示语种，可根据自己切换语种方式指定具体的语种
   globalThis.__tci18n_lang__ = {  // 当前语料数据，通过对transform提取出来的语料进行翻译后得到
       en-us: {}
   };
   ```

3. 执行 `transform`命令，提取语料并输入转换后的项目文件

   ```shell
   npx tc-i18n transform
   ```

   执行完成后，会讲语料提取到根目录下的 **locale/langs.json** 文件中，并且会在 output 指定的文件夹下生成转换后的完整项目，如下

   <!--插入语料文件截图-->

   <!--插入output文件截图-->

4. 微信小程序运行即可出现指定的语种效果

### 高级

#### tci18n.config.json配置项

| 字段名           | 字段说明                                                     | 类型     | 是否必填 | 默认值 |
| ---------------- | ------------------------------------------------------------ | -------- | -------- | ------ |
| entry            | 指定当前项目需要进行国际化的文件，支持glob匹配规则           | string[] | 是       | []     |
| exclude          | 排除不需要进行国际化的文件，支持glob匹配规则，通常与entry配合使用，达到精细化控制国际化文件 | string[] | 否       | []     |
| keyHasScene      | 提取出来的语料是否带有文件路径后缀，如: 你好#!!!#src/hello.vue_1，开启后可以使相同原文的语料同时存在。 | boolean  | 否       | false  |
| extractOnly      | 是否只提取语料而不替换本地源文件代码，关闭后在提取语料的同时会对本地源文件代码进行转换，建议慎重使用。 | boolean  | 否       | true   |
| ignoreComponents | 需要忽略提取的组件名，对于一些不需要国际化的组件，可以将其配置在其标签名字中，如: ['code']，会忽略<code></code>元素中的所有文案 | string[] | 否       | []     |
| ignoreMethods    | 需要忽略提取的函数名字，可以忽略函数中存在的文案，如: ['example']，会忽略 example('你好') 和 function example() {} 函数中的所有文案 | string[] | 否       | []     |
| ignoreAttrs      | 需要忽略的元素属性名字，可以忽略元素中一些属性中存在的文案，如: ['data']， 会忽略 <div data="你好"></div>元素中data属性里面的所有文案 | string[] | 否       | []     |
| ignoreStrings    | 需要忽略的字符串，可以忽略代码中所有命中的字符串，如: ['你好']，会忽略代码中所有的 你好 文案。如果开头为 ^ ,则代表配置的字符串是正则，会按照正则进行匹配。 | string[] | 否       | []     |
| framework        | 当前项目使用的框架，目前支持 vue2, vue3, react, 微信小程序, 静态html | string   | 是       |        |
| plugins          | 安装的插件                                                   | Plugin[] | 否       | []     |
| isDecorator      | 是否开启装饰器解析，如果代码中有装饰器语法，则需要设置为true | boolean  | 否       | False  |



#### 插件开发

`@tc-i18n` 在解析阶段提供了丰富的钩子用于插件开发，基本每一个解析阶段都可以做自定义bianji

### 官方插件

#### plugin-vm-to-template



