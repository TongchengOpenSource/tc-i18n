<!DOCTYPE html><html><head>
    <#import "/common/common.macro.ftl" as netCommon>
    <@netCommon.commonStyle />
    <!-- DataTables -->
    <link rel="stylesheet" href="${request.contextPath}/static/adminlte/plugins/datatables/dataTables.bootstrap.css"/>
    <title>业务线管理</title>
</head>
<body class="hold-transition skin-blue sidebar-mini <#if cookieMap?exists && " off"="=" cookieMap["xxljob_adminlte_settings"].value><#--sidebar-collapse<!--#if-->">-->

<@netCommon.commonScript />
<!-- DataTables -->
<script src="${request.contextPath}/static/adminlte/plugins/datatables/jquery.dataTables.min.js"></script>
<script src="${request.contextPath}/static/adminlte/plugins/datatables/dataTables.bootstrap.min.js"></script>
<script src="${request.contextPath}/static/plugins/jquery/jquery.validate.min.js"></script>
<!-- moment -->
<script src="${request.contextPath}/static/adminlte/plugins/daterangepicker/moment.min.js"></script>
<script src="${request.contextPath}/static/js/common/convert.pinyin.js"></script>
<script src="${request.contextPath}/static/js/project/project.authority.index.1.js?v=202331"></script>
<script src="${request.contextPath}/static/js/security_sdk_0.0.1.js"></script>
<script type="text/javascript">
'use client';
new Vue({ i18n: window.tci18n.tci18nVueI18n({ locale: window.__tci18n_locale__, langs: window.__tci18n_langs__ }, Vue),
  name: '132'
});
// 获取用户信息
var xhr = new XMLHttpRequest();
xhr.open('GET', '/admin/userInfo', true);
xhr.onload = function () {
  if (xhr.status === 200) {
    var userInfo = JSON.parse(xhr.responseText);
    // 使用水印
    watermark({ watermark_txt: userInfo.username + userInfo.workId });
  } else {
    console.log('获取用户信息失败');
  }
};
xhr.onerror = function () {
  console.log('出错了');
};
xhr.send();</script>


</body></html>