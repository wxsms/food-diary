import { observable, action } from 'mobx-miniprogram'
import { DateTime } from 'luxon'
import { debug } from '../utils/log.utils'
import { addDay, format, getWeekdayLong, minusDay } from '../utils/date.utils'

debug('init store')

export const store = observable({

  // 数据字段
  currentDate: DateTime.local().startOf('day'),

  // 计算属性
  get currentDateStr () {
    return format(this.currentDate)
  },
  get currentDateWeekDayStr () {
    return getWeekdayLong(this.currentDate)
  },
  get prevDateStr () {
    return format(addDay(this.currentDate), true)
  },
  get nextDateStr () {
    return format(minusDay(this.currentDate), true)
  },

  // actions
  setCurrentDate: action(function (data) {
    this.currentDate = data
  })
})
