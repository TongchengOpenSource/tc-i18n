// init date tables
var transactionTable = $("#transaction_list").dataTable({
    "deferRender": true,
    "processing": true,
    "serverSide": true,
    scrollY: 400,
    scrollX: 200,
    "ajax": {
        url: base_url + "/autopay/pageList",
        type: "post",
        data: function (d) {
            var obj = {};
            obj.draw = d.draw;
            obj.start = d.start;
            obj.length = d.length;
            obj.orderId = $('#orderId').val().trim();
            obj.projectSerialId = $('#projectSerialId').val().trim();
            obj.tradeNo = $('#tradeNo').val().trim();
            obj.supplierTradeNo = $('#supplierTradeNo').val().trim();
            return obj;
        }
    },
    "searching": false,
    "ordering": false,
    //"scrollX": true,	// scroll x，close self-adaption
    "columns": [
        {
            "data": 'orderId',  //orderId、projectSerialId
            "visible": true,
            "width": '10%',
            "render": function (data, type, row) {
                return '<span style="color:green;">订单号：</span>'
                    + row.orderId
                    + '</br><span style="color:green;">项目流水号：</span>'
                    + row.projectSerialId;
            }
        },
        {
            "data": 'tradeNo',
            "visible": true,
            "width": '9%',
            "render": function (data, type, row) {
                console.log(JSON.stringify(row));
                return function () {
                    var url = '/autopay/payDetail?tradeNo=' + row.tradeNo;
                    var title = '支付交易详情';
                    var html = '';
                    if (row.status != null && row.status != 0) {
                        //手动回写按钮
                        html = '</br><button class="btn btn-warning btn-xs update" type="button" onclick="onclickManualNotify(\'' + row.tradeNo + '\')">手动回写</button> ';
                    }
                    return '<a data-target="_blank" title="' + title + '" href="' + url + '">' + row.tradeNo + '</a>' + html;
                };
            }
        },
        {
            "data": 'productName', //支付产品
            "visible": true,
            "width": '8%',
            "render": function (data, type, row) {
                return row.productName + '</br>[' + row.productCode + ']';
            }
        },
        {
            "data": 'projectName',
            "visible": true,
            "width": '7%',
            "render": function (data, type, row) {
                return row.projectName + '</br>[' + row.projectCode + ']';
            }
        },
        {
            "data": 'amount',
            "visible": true,
            "width": '6%',
        },
        {
            "data": 'transResultDesc',
            "visible": true,
            "width": '5%'
        },
        {
            "data": 'createdOn',
            "visible": true,
            "width": '7%',
            "render": function (data, type, row) {
                return data ? moment(new Date(data)).format("YYYY-MM-DD HH:mm:ss") : "";
            }
        },
        {
            "data": 'finishedTime',
            "visible": true,
            "width": '7%',
            "render": function (data, type, row) {
                return data ? moment(new Date(data)).format("YYYY-MM-DD HH:mm:ss") : "";
            }
        },
        {
            "data": 'remark',
            "visible": true,
            "width": '6%'
        }
    ],
    "language": {
        "sProcessing": '处理中...',
        "sLengthMenu": '每页 _MENU_ 条记录',
        "sZeroRecords": '没有匹配结果',
        "sInfo": '第 _PAGE_ 页 ( 总共 _PAGES_ 页，_TOTAL_ 条记录 )',
        "sInfoEmpty": '无记录',
        "sInfoFiltered": '(由 _MAX_ 项结果过滤)',
        "sInfoPostFix": "",
        "sSearch": '搜索',
        "sUrl": "",
        "sEmptyTable": '表中数据为空',
        "sLoadingRecords": '载入中...',
        "sInfoThousands": ",",
        "oPaginate": {
            "sFirst": '首页',
            "sPrevious": '上页',
            "sNext": '下页',
            "sLast": '末页'
        },
        "oAria": {
            "sSortAscending": ': 以升序排列此列',
            "sSortDescending": ': 以降序排列此列'
        }
    }
});

// table data
var tableData = {};
// search btn
$('#searchBtn').on('click', function () {
    transactionTable.fnDraw();
});

function onclickManualNotify(data) {
    layer.confirm('确认处理', {
        icon: 3,
        title: '系统提示',
        btn: ['确定', '取消']
    }, function (index) {
        layer.close(index);
        $.ajax({
            type: 'POST',
            url: base_url + "/autopay/manualNotify",
            data: {
                "tradeNos": data
            },
            dataType: "json",
            success: function (data) {
                if (data == 'success') {
                    layer.open({
                        title: '系统提示',
                        btn: ['确定'],
                        content: '更新完成',
                        icon: '1',
                        end: function (layero, index) {
                            window.location.reload();
                        }
                    });
                } else {
                    layer.open({
                        title: '系统提示',
                        btn: ['确定'],
                        content: '失败',
                        icon: '2'
                    });
                }
            },
            error: function (xhr, textStatus, errorThrown) {
                layer.open({
                    title: '系统提示',
                    btn: ['确定'],
                    content: "返回响应信息：" + xhr.responseText,
                    icon: '1'
                });
            }
        });
    });
}