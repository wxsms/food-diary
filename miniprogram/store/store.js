import { observable, action } from 'mobx-miniprogram'
import { DateTime } from 'luxon'

export const store = observable({

  // 数据字段
  currentDateTs: DateTime.local().startOf('day').ts,

  // 计算属性
  get currentDateStr () {
    return DateTime.fromMillis(this.currentDateTs).toFormat('yyyy年L月d日')
  },
  get prevDateStr () {
    return DateTime.fromMillis(this.currentDateTs).minus({ days: 1 }).toFormat('L月d日')
  },
  get nextDateStr () {
    return DateTime.fromMillis(this.currentDateTs).plus({ days: 1 }).toFormat('L月d日')
  },
  get currentDateWeekDay () {
    return DateTime.fromMillis(this.currentDateTs).weekdayLong
  },

  // actions
  setCurrentDateTs: action(function (ts) {
    this.currentDateTs = ts
  })
})
