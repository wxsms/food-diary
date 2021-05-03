import { observable, action } from 'mobx-miniprogram'
import { DateTime } from 'luxon'
import { debug } from '../utils/log.utils'
import {
  addDay,
  addMonth, endOfMonth,
  format,
  FORMATS,
  getWeekdayLong,
  minusDay,
  minusMonth,
  startOfMonth
} from '../utils/date.utils'
import get from 'lodash.get'

debug('init store')

export const store = observable({
  // 数据字段
  // 当前选择的日期
  currentDate: DateTime.local().startOf('day'),
  // 当前选择日期的数据
  todayRecord: null,
  // 在日历界面展示的当前月份
  currentMonth: DateTime.local().startOf('month'),
  // scd 记录相关
  scdRecord: null,
  // scd 记录更新相关
  selectedScdFood: null,
  showUpdateActionSheet: false,
  // 生物制剂相关
  remicadeRecords: [],
  vedolizumabRecords: [],
  ustekinumabRecords: [],
  adalimumabRecords: [],

  // 计算属性
  // 当前日期数据相关
  get todayHasWeight () {
    if (this.todayRecord) {
      return typeof this.todayRecord.weight === 'number'
    } else {
      return false
    }
  },
  get todayHasDefecation () {
    if (this.todayRecord) {
      return typeof this.todayRecord.defecation === 'number'
    } else {
      return false
    }
  },
  get todayHasDefecationRemark () {
    return get(this.todayRecord, 'defecationRemark') || ''
  },
  // 日期相关
  get currentDateTs () {
    return this.currentDate.ts
  },
  get currentDateStr () {
    return format(this.currentDate)
  },
  get currentDateWeekDayStr () {
    return getWeekdayLong(this.currentDate)
  },
  get prevDateStr () {
    return format(minusDay(this.currentDate), FORMATS.M_D)
  },
  get nextDateStr () {
    return format(addDay(this.currentDate), FORMATS.M_D)
  },
  // 日历相关
  get currentMonthStr () {
    return format(this.currentMonth, FORMATS.Y_M)
  },
  get prevMonthStr () {
    return format(minusMonth(this.currentMonth), FORMATS.Y_M)
  },
  get nextMonthStr () {
    return format(addMonth(this.currentMonth), FORMATS.Y_M)
  },
  get monthStart () {
    return startOfMonth(this.currentMonth)
  },
  get monthEnd () {
    return endOfMonth(this.currentMonth)
  },
  // actions
  setCurrentDate: action(function (data) {
    this.currentDate = typeof data === 'number' ? DateTime.fromMillis(data) : data
  }),
  setCurrentMonth: action(function (data) {
    this.currentMonth = typeof data === 'number' ? DateTime.fromMillis(data) : data
  }),
  setTodayRecord: action(function (data) {
    this.todayRecord = data
  }),
  setScdRecord: action(function (data) {
    this.scdRecord = data
  }),
  setSelectedScdFood: action(function (data) {
    this.selectedScdFood = data
  }),
  setShowUpdateActionSheet: action(function (data) {
    this.showUpdateActionSheet = data
  }),
  setRemicadeRecords: action(function (data) {
    this.remicadeRecords = data
  }),
  setVedolizumabRecords: action(function (data) {
    this.vedolizumabRecords = data
  }),
  setUstekinumabRecords: action(function (data) {
    this.ustekinumabRecords = data
  }),
  setAdalimumabRecords: action(function (data) {
    this.adalimumabRecords = data
  })
})
