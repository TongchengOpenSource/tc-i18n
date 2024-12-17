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
    framework: FRAMEWORK.MINIPROGRAM,
}

const transformer = new Transformer(tci18nConfig);
describe('小程序代码测试', () => {
    it('wxml解析', async () => {
        const code = `<view wx:if="{{!is_not}}" class="use-wrap">
<view class="uu-top">
  <view wx:if="{{use_obj.useLimit != -1}}" class="u-status">{{use_obj.useLimit == 1 && use_obj.useNum == 0 ? '未使用' :
    '剩余次数：' + use_obj.sy_count }} </view>
</view>
  <view class="u-time flex">
    <view class="l">
      订单编号：{{use_obj.orderDetailId}}
    </view>
    <view bindtap="copyId" class="r flex_c">
      <image src="https://file.40017.cn/guide/mini_qyt/pjl/commercial/hx/copy.png"></image>
      复制
    </view>
  </view>
  <view class="main">
    <view class="top">
      <view class="title flex_between">
        <view class="l">优惠信息</view>
        <view class="r flex_c" bindtap="showUse">使用说明 <image
            src="https://file.40017.cn/guide/mini_qyt/pjl/commercial/use/wh.png"></image>
        </view>
      </view>
      <view class="quan flex_c">
        <image src="https://file.40017.cn/guide/mini_qyt/pjl/commercial/use/icon-1.png"></image>
        <text class="t"> {{use_obj.equityName}}</text>
       
      </view>
      <view class="desc">{{use_obj.merchantName}}</view>
      <view wx:if="{{use_obj.useTimeLimit != 0}}" class="desc">使用时间：{{use_obj.useStartTime}} - {{use_obj.useEndTime}} </view>
      <view wx:if="{{use_obj.useTimeLimit == 0}}" class="desc">使用时间： 不限制使用日期</view>
    </view>
    <view class="middle t_c">
      <view class="middle-c">
        <view class="quan">券码：{{use_obj.code_v}}</view>
        <view class="qrcode">
          <canvas type="2d" style="width: 150px; height: 150px; margin:0 auto;" id="myQrcode"></canvas>
        </view>
        <view wx:if="{{!count}}" class="qr-desc flex_c3" bindtap="getUse">
          二维码已失效，请手动刷新
          <image src="https://file.40017.cn/guide/mini_qyt/pjl/commercial/refresh.png" alt=""></image>
        </view>
        <view wx:if="{{count}}" class="qr-desc flex_c3">{{ count }}s 后二维码失效</view>
      </view>
    </view>
    <view class="bottom">
      <view class="title">商家信息</view>
      <view class="title-2">{{use_obj.merchantName}}</view>
      <view class="flex_c time">
        <image src="https://file.40017.cn/guide/mini_qyt/pjl/commercial/use/time.png"></image>
        营业时间
      </view>
      <view class="desc">{{use_obj.openTime || '无'}}</view>
      <view class="address-b flex_between_c">
        <view class="l">
          <view class="flex_c time">
            <image src="https://file.40017.cn/guide/mini_qyt/pjl/commercial/use/posi.png"></image>
            {{use_obj.adress}}
          </view>
          <!-- <view class="desc">距您约5.6km</view> -->

        </view>
        <view class="r">
          <image wx:if="{{!use_obj.is_zw}}" bindtap="makePhoneCall" class="r-img"
            src="https://file.40017.cn/guide/mini_qyt/pjl/commercial/use/phone.png"></image>
          <image wx:if="{{use_obj.latitude}}" bindtap="goLocation" class="r-img"
            src="https://file.40017.cn/guide/mini_qyt/pjl/commercial/use/navi.png"></image>
        </view>
      </view>
    </view>
    <view class="info-c">
      <view class="title5">温馨提示:</view>
      <view class="desc5">请谨慎保管您的二维码，切勿轻易发给别人，以防被他人使用而造成损失。二维码有效期为1分钟，如超过时间请重新生成。</view>
    </view>
  </view>
  <van-action-sheet show="{{ show_use }}" round="{{false}}" title="使用说明" bind:close="closeUse"
    close-on-click-overlay="{{true}}">
    <view class="use-detail">
      <rich-text nodes="{{use_obj.useDesc || '无'}}"></rich-text>
    </view>
  </van-action-sheet>
</view>
<view wx:if="{{is_not}}" class="not-data">
<image src="https://file.40017.cn/guide/mini_qyt/pjl/comment/nodata.png"></image>
<view class="not-text">{{use_obj.message}}</view>
</view>`;
        const { code: newCode, hasError } = await transformer.transformCode(code, SOURCE_TYPE.WXML, 'text.wxml');
        assert.ok(!hasError);
    });
    it('wxs解析', async () => {
        const code = `function filterTextFn(item) {
    return ["全部分类", "价格区间", "智能排序", "筛选"].indexOf(item) == -1
}
module.exports = {
    filterTextFn:filterTextFn
}`
        const { code: newCode } = await transformer.transformCode(code, SOURCE_TYPE.WXS, 'text.wxs');
        assert.ok(newCode.includes(`var intl = require("tci18n.wxs")`));
    })
});
