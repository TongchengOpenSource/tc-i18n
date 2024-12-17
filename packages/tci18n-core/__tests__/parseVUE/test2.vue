/**
* 同程旅行（https://www.ly.com/）.
* 苏公网安备32059002001003号 © 2002-2023ly.com All Rights Reserved. | 苏ICP备09033604号.
* @Date: 2024.06.13.
* @Author
* @Description 预订管理 - 预订列表 页面 .
**/
<script setup lang="tsx" name="BookList">
import { ref, defineAsyncComponent, reactive, onMounted, Ref, unref } from "vue"
import { Table, TableColumn, TableSlotDefault } from "@/viz/components/Table"
import { useTable } from "@/viz/hooks/web/useTable"
import urls from "@/api/urls"
import { postData } from "@/http"
import { returnError } from "@/utils/common"
import { useRouter, useRoute } from "vue-router"
import { isSuc } from "@/utils"
import dayjs from "dayjs"
import { cloneDeep } from "lodash-es"
import { subtract } from "@/utils/math"
import { returnAccStatus } from "@/utils/enum"
import { SearchData } from "./basic"
import { useConfig } from "@/hooks/useConfig"
import { toPositiveInteger } from "@/utils/tools"
import BookListSearch from "./search/index.vue"
import CancelReason from "../common/CancelReason.vue"
import InfoTips from "@/components/common/InfoTips.vue"
import dataEmpty from "@/components/common/NoData.vue"

const OperateBtns = defineAsyncComponent(() => import("../common/OperateBtns"))

const router = useRouter()
const route = useRoute()
const accStatusObj = returnAccStatus("o")
const { useMicFormat, useTimeFormat } = useConfig()
const searchColumns = reactive<TableColumn[]>([{
  field: "selection",
  type: "selection"
}, {
  field: "accStatus",
  label: "状态",
  minWidth: "100px",
  slots: {
    default: (data: TableSlotDefault) => {
      return (
        <>
          <div>{accStatusObj[data?.row?.accStatus ?? ""] || "--"}</div>
        </>
      )
    }
  }
}, {
  field: "bookingNo",
  label: "订单号",
  width: 120,
  slots: {
    default: (data: TableSlotDefault) => {
      return (
        <>
          <div>{data?.row?.bookingNo ?? "--"}</div>
        </>
      )
    }
  }
}, {
  field: "acctNo",
  label: "账号",
  width: 120,
  slots: {
    default: (data: TableSlotDefault) => {
      return (<div>{data?.row?.acctNo ?? "--"}</div>)
    }
  }
}, {
  field: "guestName",
  label: "客人",
  slots: {
    default: (data: TableSlotDefault) => {
      return (
        <>
          <div>{data?.row?.guestName ?? "--"}</div>
        </>
      )
    }
  }
}, {
  field: "roomNo",
  label: "房号",
  slots: {
    default: (data: TableSlotDefault) => {
      return (
        <>
          <div>{data?.row?.roomNo ?? "--"}</div>
        </>
      )
    }
  }
}, {
  field: "roomTypeName",
  label: "房型",
  minWidth: "100px",
  slots: {
    default: (data: TableSlotDefault) => {
      return (
        <>
          <div>{data?.row?.roomTypeName ?? "--"}</div>
        </>
      )
    }
  }
}, {
  field: "roomQuantity",
  label: "房数",
  align: "right",
  headerAlign: "right",
  slots: {
    default: (data: TableSlotDefault) => {
      return (
        <>
          <div>{data?.row?.roomQuantity ?? "--"}</div>
        </>
      )
    }
  }
},
{
  field: "adultCnt",
  label: "成人/儿童",
  align: "right",
  minWidth: "100px",
  headerAlign: "right",
  slots: {
    default: (data: TableSlotDefault) => {
      return (
        <>
          <div>
            {data?.row?.adultCnt} / {data.row.childrenCnt}
          </div>
        </>
      )
    }
  }
},
{
  field: "rateAmt",
  label: "房价",
  align: "right",
  headerAlign: "right",
  slots: {
    default: (data: TableSlotDefault) => (
      <>{useMicFormat(data?.row?.rateAmt ?? 0)}</>
    )
  }
},
{
  field: "roomAmt",
  label: "总房费",
  align: "right",
  headerAlign: "right",
  slots: {
    default: (data: TableSlotDefault) => (
      <>{useMicFormat(data?.row?.roomAmt ?? 0)}</>
    )
  }
},
{
  field: "payableAmt",
  label: "应付金额",
  align: "right",
  headerAlign: "right",
  slots: {
    default: (data: TableSlotDefault) => (
      <>{useMicFormat(data?.row?.payableAmt ?? 0)}</>
    )
  }
},
{
  field: "balanceAmt",
  label: "余额",
  align: "right",
  headerAlign: "right",
  slots: {
    default: (data: TableSlotDefault) =>
      data.$index > -1 ? (
        <>
          {useMicFormat(
            subtract(data?.row?.creditAmt ?? 0, data.row.debitAmt ?? 0)
          )}
        </>
      ) : (
        <></>
      )
  }
},
{
  field: "onlinePayment",
  label: "线上预付款",
  width: 120,
  align: "right",
  headerAlign: "right",
  slots: {
    default: (data: TableSlotDefault) => (
      <>{useMicFormat(data?.row?.onlinePayment)}</>
    )
  }
},
{
  field: "checkinTime",
  label: "来期",
  minWidth: "130px",
  slots: {
    default: (data: TableSlotDefault) => (
      <div>{useTimeFormat(data?.row?.checkinTime, "hm")}</div>
    )
  }
},
{
  field: "checkoutTime",
  label: "离期",
  minWidth: "130px",
  slots: {
    default: (data: TableSlotDefault) => (
      <div>{useTimeFormat(data?.row?.checkoutTime, "hm")}</div>
    )
  }
},
{
  field: "action",
  label: "操作",
  headerAlign: "center",
  width: 200,
  align: "center",
  fixed: "right",
  slots: {
    default: (data: TableSlotDefault) => {
      return (
        <div class="opr-btns">
          <el-button
            type="primary"
            text
            onClick={() => {
              handleAESClick("edit", data)
            }}
          >
            {" "}
              编辑{" "}
          </el-button>
          <el-button
            type="primary"
            text
            onClick={() => {
              handleAESClick("finance", data)
            }}
            v-if={["1-RSV", "0-STY", "3-OUT"].includes(data?.row?.accStatus)}
          >
            {" "}
              账务{" "}
          </el-button>
          <OperateBtns
            renderType={2}
            orderInfo={data.row}
            onClick={(ty: string) => {
              handlerOperateClickData(ty, data.row)
            }}
          />
        </div>
      )
    }
  }
}])

const searchParams = ref({
  accStatusList: ["1-RSV", "0-STY"],
  queryType: 0,
  queryKeyData: ""
}) as Ref<SearchData>

const totalRoomFee = ref(0),
      totalPersonCnt = ref(0),
      totalRoomQuantity = ref(0),
      totalRoomAmt = ref(0)

const { tableRegister, tableMethods, tableState } = useTable({
  immediate: false, // 因为组件默认是pageSize 是10，我这边给修改成成了100 导致初始化时会发送一次请求，修改pageSize也会发送一次请求
  fetchDataApi: async () => {
    const { currentPage, pageSize } = tableState

    const obj: any = cloneDeep(searchParams.value)
    const moreObj = obj.moreConditions
    delete obj.moreConditions

    const res: any = await postData(urls.postBookPageUrl, {
      pageIndex: unref(currentPage),
      pageSize: unref(pageSize),
      ...obj,
      ...moreObj
    })
    if (isSuc(res)) {
      totalRoomFee.value = res?.data?.totalRoomFee ?? 0
      totalPersonCnt.value = res?.data?.totalPersonCnt ?? 0
      totalRoomQuantity.value = res?.data?.totalRoomQuantity ?? 0
      totalRoomAmt.value = res?.data?.total ?? 0
      return {
        list: res?.data?.datas ?? [],
        total: res?.data?.total ?? 0
      }
    } else {
      return {
        list: [],
        total: 0
      }
    }
  }
})

onMounted(() => {
  let queryType = toPositiveInteger(`${route?.query?.queryType ?? 0}`)
  queryType = queryType > 10 ? 0 : queryType
  let queryKeyData = `${route?.query?.queryWords ?? ""}`
  searchParams.value = {
    ...searchParams.value,
    queryKeyData,
    accStatusList:
      queryType === 5
        ? [...searchParams.value.accStatusList, "3-OUT"]
        : queryType === 6
          ? [...searchParams.value.accStatusList, "5-CXL"]
          : queryType === 7
            ? [...searchParams.value.accStatusList, "4-NSW"]
            : [...searchParams.value.accStatusList],
    queryType: queryType as SearchData["queryType"]
  }
  // 不改变大小的话，就要refresh
  pageSize.value = 100
})

const { loading, dataList, total, currentPage, pageSize } = tableState

const { refresh } = tableMethods

const handleSearch = () => {
  refresh()
}

/**
 *@Description 新增 明细 .
 *@Return
 **/
const handleAESClick = async (t: string, data?: any) => {
  let path
  let query

  if (t === "add" || t === "edit") {
    path = "/pre-mgt/pre-book-aes"
    query = { pageType: t, acctNo: data?.row?.acctNo || "" }
  } else if (t === "finance") {
    // 账务
    path = "/cashier-mgt/cashier-list"
    query = { ref: "book", pageType: "cw", acctNo: data?.row?.acctNo ?? "" }
  }

  await router.push({ path, query })
}

const handlerOperateClickData = (type: string, data: any) => {
  if (type === "RSV_CANCEL") {
    // 取消预订
    cancelData.value = data || {}
    dialogCancelVisible.value = true
  } else if (type === "changeRm") {
    // 换房
    // 换房缺少两个字段：1、roomId，2:update time
    changeData.value = {
      acctNo: data?.acctNo ?? "",
      roomNo: data?.roomNo ?? "",
      arrDt: dayjs(data?.checkinTime ?? "").format("YYYY-MM-DD"),
      arrTm: dayjs(data?.checkinTime ?? "").format("HH:mm"),
      dptDt: dayjs(data?.checkoutTime ?? "").format("YYYY-MM-DD"),
      dptTm: dayjs(data?.checkoutTime ?? "").format("HH:mm")
    }
    dialogChangeVisible.value = true
  }
}
const dialogCancelVisible = ref(false),
      cancelData = ref({} as Record<string, any>)
const handlerCancelSubmit = async (data: Record<string, any>) => {
  // console.log('取消原因', cancelData.value)

  const p = {
    acctNo: cancelData?.value?.acctNo ?? "", // 预订账号
    cancelNote: data?.cancelNote ?? "", // 取消原因内容
    updateTime: cancelData?.value?.updateTime ?? "", // 更新时间
    cancelSerialId: data?.cancelSerialId ?? "", // 取消原因生成id（参数）
    operateType: "RSV_CANCEL" // 操作类型
  }
  const res: any = await postData(urls.postBookStatusUrl, p)
  if (!isSuc(res)) {
    returnError(res.message)
    return false
  }
  refresh()
  dialogCancelVisible.value = false
  cancelData.value = {}
}

const ChangeRmRef = ref()
const dialogChangeVisible = ref(false),
      changeData = ref({} as Record<string, any>)
const handlerRoomChangeSave = async () => {
  const d = await ChangeRmRef.value.exposeValidate()
  if (d) {
    d.acctNo = changeData.value?.acctNo ?? ""
    d.updateTime = changeData.value?.updateTime ?? ""
    const r = await postData(urls.postUpdateRoomUrl, d)
    if (isSuc(r)) {
      dialogChangeVisible.value = false
      refresh()
    } else {
      returnError(r.message)
    }
  }
}
</script>

<template>
  <div class="book-mgt-container">
    <!-- 查 询 -->
    <div class="search-unit">
      <el-row>
        <el-col :span="24">
          <BookListSearch v-model="searchParams" @search="handleSearch" @reset="handleSearch" />
        </el-col>
        <el-col :span="24">
          <InfoTips
            :list="[
              { label: '总', value: total },
              { label: '总房数', value: totalRoomQuantity },
              { label: '总人数', value: totalPersonCnt },
              { label: '总房费', value: totalRoomFee },
            ]"
          />
        </el-col>
      </el-row>
    </div>

    <div class="table-container">
      <!-- 表头 按钮 -->
      <section class="caption flex">
        <el-button type="primary" @click="handleAESClick('add')">
          <i class="iconfont icon-plus"></i>创建
        </el-button>
      </section>
      <!-- 表 格 -->
      <Table
        :loading="loading"
        :columns="searchColumns"
        :data="dataList"
        :border="false"
        @register="tableRegister"
        @refresh="refresh"
        v-model:pageSize="pageSize"
        v-model:currentPage="currentPage"
        height="100%"
        :pagination="{ total: total }"
      >
        <template #empty>
          <dataEmpty />
        </template>
      </Table>
    </div>

    <!-- 取消原因 弹窗 -->
    <CancelReason
      ref="ReasonRef"
      @emit-reason="handlerCancelSubmit"
      v-model="dialogCancelVisible"
    />

    <!-- 换房 弹窗-->
    <SlotDialog
      title="换房"
      width="600px"
      @emit-save="handlerRoomChangeSave"
      v-model="dialogChangeVisible"
    >
      <ChangeRoom ref="ChangeRmRef" :editRsvAccount="changeData" />
    </SlotDialog>
  </div>
</template>

<style scoped lang="scss">
.book-mgt-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.search-unit {
  width: 100%;
  padding: 16px 16px 0 16px;
  margin-right: -16px;
  border-radius: 8px;
  background: #fff;
  box-sizing: border-box;
  margin-bottom: 8px;
}

:deep(.info-constainer > dl:last-child) {
  margin-right: 0;
}

.caption {
  // padding-bottom: 32px;
  background-color: #fff;
  position: relative;
  // margin-bottom: -24px;
  border-radius: 8px;
}
:deep(.opr-btns .el-button) {
  padding: 8px;
  margin-left: 0;
}
.table-container {
  padding: 16px;
  background-color: #fff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
}
:deep(.table-wrapper) {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
