const { DateTime } = require('luxon')

Page({
  data: {
    currentDate: null,
    currentDateStr: '',
    currentDateWeekDay: '',
    prevDateStr: '',
    nextDateStr: ''
  },
  onLoad () {
    this.setData({
      currentDate: DateTime.local()
    }, () => {
      this.prepareViewData()
    })
  },
  prepareViewData () {
    this.setData({
      currentDateStr: this.data.currentDate.toLocaleString(),
      currentDateWeekDay: this.data.currentDate.weekdayLong,
      prevDateStr: this.data.currentDate.minus({ days: 1 }).toLocaleString(),
      nextDateStr: this.data.currentDate.plus({ days: 1 }).toLocaleString()
    })
  },
  goPrevDay () {
    this.setData({
      currentDate: this.data.currentDate.minus({ days: 1 })
    }, () => {
      this.prepareViewData()
    })
  },
  goNextDay () {
    this.setData({
      currentDate: this.data.currentDate.plus({ days: 1 })
    }, () => {
      this.prepareViewData()
    })
  }
})
