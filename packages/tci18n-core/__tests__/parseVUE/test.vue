<template>
    <el-menu
        class="bd-r-w_0"
        :router="true"
        :default-active="defaultActive"
        :default-openeds="['1', '2','3']"
        @select="onSelectMenu"
    >
        <el-sub-menu index="1" v-if="projectStore.isManager || projectStore.isMember">
            <template #title>项目信息</template>
            <el-menu-item index="1-1" :route="{ path: `/project/ProjectDetail/${$route.params.id}/info`}">
                <span class="iconfont tci18n-jichuxinxi mg-r_6"></span>
                <span>基础信息</span>
            </el-menu-item>
            <!-- <el-menu-item index="1-2" :route="{ path: `/project/ProjectDetail/${$route.params.id}/guide`}">
                <span class="iconfont tci18n-zhinanzhidao-xianxing mg-r_6"></span>
                <span>接入指南</span>
            </el-menu-item> -->
            <el-sub-menu index="1-3">
                <template #title>
                    <span class="iconfont tci18n-zhinanzhidao-xianxing mg-r_6"></span>
                    <span>接入指南</span>
                </template>
                <el-menu-item-group>
                    <template #title>前端接入</template>
                    <el-menu-item index="1-3-1" :route="{ path: `/project/ProjectDetail/${$route.params.id}/newGuide/vue2`}">
                        <svg class="icon fs-lg mg-r_6" aria-hidden="true">
                            <use xlink:href="#tci18n-Vue"></use>
                        </svg>
                        <span>Vue2接入</span>
                    </el-menu-item>
                    <el-menu-item index="1-3-2" :route="{ path: `/project/ProjectDetail/${$route.params.id}/newGuide/vue3`}">
                        <svg class="icon fs-lg mg-r_6" aria-hidden="true">
                            <use xlink:href="#tci18n-Vue"></use>
                        </svg>
                        <span>Vue3接入</span>
                    </el-menu-item>
                    <el-menu-item index="1-3-3" :route="{ path: `/project/ProjectDetail/${$route.params.id}/newGuide/react`}">
                        <svg class="icon fs-lg mg-r_6" aria-hidden="true">
                            <use xlink:href="#tci18n-React"></use>
                        </svg>
                        <span>React接入</span>
                    </el-menu-item>
                    <el-menu-item index="1-3-4" :route="{ path: `/project/ProjectDetail/${$route.params.id}/newGuide/static`}">
                        <svg class="icon fs-lg mg-r_6" aria-hidden="true">
                            <use xlink:href="#tci18n-HTML"></use>
                        </svg>
                        <span>静态HTML接入</span>
                    </el-menu-item>
                    <el-menu-item index="1-3-10" :route="{ path: `/project/ProjectDetail/${$route.params.id}/newGuide/miniProgram`}">
                        <svg class="icon fs-lg mg-r_6" aria-hidden="true">
                            <use xlink:href="#tci18n-weixin"></use>
                        </svg>
                        <span>微信小程序接入</span>
                    </el-menu-item>
                    <el-menu-item index="1-3-12" :route="{ path: `/project/ProjectDetail/${$route.params.id}/newGuide/ssr`}">
                        <span class="ssrLogo mg-r_6">SSR</span>
                        <span>服务端渲染项目接入</span>
                    </el-menu-item>
                    <el-menu-item index="1-3-9" :route="{ path: `/project/ProjectDetail/${$route.params.id}/newGuide/tci18nPlugin`}">
                        <svg class="icon fs-xl mg-r_6 primary" aria-hidden="true">
                            <use xlink:href="#tci18n-npm"></use>
                        </svg>
                        <span>tci18n插件</span>
                    </el-menu-item>
                </el-menu-item-group>
                <el-menu-item-group>
                    <template #title>后端接入</template>
                    <el-menu-item index="1-3-5" :route="{ path: `/project/ProjectDetail/${$route.params.id}/newGuide/java`}">
                        <svg class="icon fs-lg mg-r_6" aria-hidden="true">
                            <use xlink:href="#tci18n-java"></use>
                        </svg>
                        <span>Java接入</span>
                    </el-menu-item>
                    <el-menu-item index="1-3-6" :route="{ path: `/project/ProjectDetail/${$route.params.id}/newGuide/net`}">
                        <img class="w_20" src="@/assets/img/net.png"/>
                        <span>.NET接入</span>
                    </el-menu-item>
                    <el-menu-item index="1-3-11" :route="{ path: `/project/ProjectDetail/${$route.params.id}/newGuide/nodejs`}">
                        <svg class="icon mg-r_6" style="font-size: 30px; margin-left: -13px" aria-hidden="true">
                            <use xlink:href="#tci18n-Nodejs"></use>
                        </svg>
                        <span>Nodejs接入</span>
                    </el-menu-item>
                </el-menu-item-group>
                <el-menu-item-group>
                    <template #title>通用接入</template>
                    <el-menu-item index="1-3-7" :route="{ path: `/project/ProjectDetail/${$route.params.id}/newGuide/webTranslate`}">
                        <svg class="icon fs-lg mg-r_6 primary" aria-hidden="true">
                            <use xlink:href="#tci18n-EAe"></use>
                        </svg>
                        <span>网页全局翻译</span>
                    </el-menu-item>
                    <el-menu-item index="1-3-8" :route="{ path: `/project/ProjectDetail/${$route.params.id}/newGuide/json`}">
                        <svg class="icon fs-lg mg-r_6 danger" aria-hidden="true">
                            <use xlink:href="#tci18n-json"></use>
                        </svg>
                        <span>JSON接入</span>
                    </el-menu-item>
                </el-menu-item-group>
            </el-sub-menu>
        </el-sub-menu>
        <el-sub-menu index="2" v-if="!keyProject && (projectStore.isManager || projectStore.isMember)">
            <template #title>智能语料</template>
            <el-menu-item index="2-1" :route="{ path: `/project/ProjectDetail/${$route.params.id}/langs`}">
                <span class="iconfont tci18n-zhinengtonghang mg-r_2" style="font-size: 26px;"></span>
                <span>语料包管理</span>
            </el-menu-item>
            <el-menu-item index="2-2" :route="{ path: `/project/ProjectDetail/${$route.params.id}/publish`}">
                <span class="iconfont tci18n-fabu mg-r_6"></span>
                <span>发布管理</span>
            </el-menu-item>
            <el-menu-item index="2-3" :route="{ path: `/project/ProjectDetail/${$route.params.id}/version`}">
                <span class="iconfont tci18n-banben mg-r_6"></span>
                <span>版本管理</span>
            </el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="3" v-if="projectStore.isManager || projectStore.isMember">
            <template #title>标准语料</template>
            <el-menu-item index="3-1" :route="{ path: `/project/ProjectDetail/${$route.params.id}/sdlangs`}">
                <span class="iconfont tci18n-yuyannengli mg-r_6"></span>
                <span>静态语料管理</span>
            </el-menu-item>
            <el-menu-item index="3-2" :route="{ path: `/project/ProjectDetail/${$route.params.id}/sdPublish`}">
                <span class="iconfont tci18n-daifabuliebiao_icon mg-r_6"></span>
                <span>静态语料发布</span>
            </el-menu-item>
            <el-menu-item index="3-4" :route="{ path: `/project/ProjectDetail/${$route.params.id}/sdVersion`}">
                <span class="iconfont tci18n-banben mg-r_6"></span>
                <span>静态语料版本</span>
            </el-menu-item>
            <el-menu-item v-if="projectData.isDynamic" index="3-3" :route="{ path: `/project/ProjectDetail/${$route.params.id}/dynamicsLangs`}">
                <span class="iconfont tci18n-yuyannengli mg-r_6"></span>
                <span>动态语料管理</span>
            </el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="5">
            <template #title>质检管理</template>
            <el-menu-item index="5-1" :route="{ path: `/project/ProjectDetail/${$route.params.id}/pageManagement`}">
                <span class="iconfont tci18n-jichuxinxi mg-r_6"></span>
                <span>质检语料</span>
            </el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="4" v-if="projectStore.isManager || projectStore.isMember">
            <template #title>权限管理</template>
            <el-menu-item index="4-1" :route="{ path: `/project/ProjectDetail/${$route.params.id}/role`}">
                <span class="iconfont tci18n-quanxianguanli- mg-r_6"></span>
                <span>权限设置</span>
            </el-menu-item>
        </el-sub-menu>
        <el-menu-item @click="openDoc" v-if="projectStore.isManager || projectStore.isMember">
            <el-icon><Reading /></el-icon>
            <template #title>操作手册</template>
        </el-menu-item>
    </el-menu>
</template>

<script lang="ts">
    import { defineBaseComponent } from '@/common/ui/DefineBaseComponent';
    import BaseView from '@/common/ui/BaseView';

    class MenuList extends BaseView {
        projectStore = this.$store.useProjectStore();

        projectData = this.$computed(() => this.projectStore.projectData!);

        loginStore = this.$store.useLoginStore();

        keyProject = this.$computed(() => this.projectData.value.keyProject || false);

        isLoading = this.$ref(false);

        closeVisible = this.$ref(false);

        defaultActive = this.$computed(() => {
            switch(true) {
                case !!~this.$route.path.indexOf('/info'): return '1-1';
                case !!~this.$route.path.indexOf('/guide'): return '1-2';
                case !!~this.$route.path.indexOf('/vue2'): return '1-3-1';
                case !!~this.$route.path.indexOf('/vue3'): return '1-3-2';
                case !!~this.$route.path.indexOf('/react'): return '1-3-3';
                case !!~this.$route.path.indexOf('/static'): return '1-3-4';
                case !!~this.$route.path.indexOf('/java'): return '1-3-5';
                case !!~this.$route.path.indexOf('/net'): return '1-3-6';
                case !!~this.$route.path.indexOf('/webTranslate'): return '1-3-7';
                case !!~this.$route.path.indexOf('/json'): return '1-3-8';
                case !!~this.$route.path.indexOf('/tci18nPlugin'): return '1-3-9';
                case !!~this.$route.path.indexOf('/miniProgram'): return '1-3-10';
                case !!~this.$route.path.indexOf('/ssr'): return '1-3-12';
                case !!~this.$route.path.indexOf('/nodejs'): return '1-3-11';
                case !!~this.$route.path.indexOf('/langs'): return '2-1';
                case !!~this.$route.path.indexOf('/publish'): return '2-2';
                case !!~this.$route.path.indexOf('/version'): return '2-3';
                case !!~this.$route.path.indexOf('/sdlangs'): return '3-1';
                case !!~this.$route.path.indexOf('/sdPublish'): return '3-2';
                case !!~this.$route.path.indexOf('/dynamicsLangs'): return '3-3';
                case !!~this.$route.path.indexOf('/sdVersion'): return '3-4';
                case !!~this.$route.path.indexOf('/role'): return '4-1';
                case !!~this.$route.path.indexOf('/pageManagement'): return '5-1';
            }
            return '1-1';
        });

        protected $init(): void {
        }

        openDoc() {
            this.$service.commonService.openOpDoc();
        }
    }
    
    export default defineBaseComponent<MenuList>(MenuList);
</script>

<style lang="scss" scoped>
.iconfont {
    font-size: 20px;
}
.ssrLogo {
    font-style: italic;
    color: transparent;
    background-clip: text;
    background-image: linear-gradient(45deg, #4ac7ff, #bd34fe);
    margin-left: -8px;
    font-weight: bold;
    font-size: 12px;
}
</style>
