import { DateTime } from 'luxon'
import { find, chunk } from 'lodash'

const app = getApp()

Page({
  data: {
    currentDate: null,
    currentDateStr: '',
    prevDateStr: '',
    nextDateStr: '',
    records: []
  },
  onLoad ({ ts }) {
    this.setData({
      currentDate: DateTime.fromMillis(Number(ts)).startOf('day')
    }, () => {
      this.fetchData()
      this.prepareViewData()
    })
  },
  fetchData () {
    wx.showLoading({
      mask: true,
      title: '加载中...'
    })
    const db = wx.cloud.database()
    const cmd = db.command
    const monthStart = this.data.currentDate.startOf('month')
    const monthEnd = this.data.currentDate.endOf('month')
    return db.collection('records').where({
      _openid: app.globalData.openid,
      date: cmd.gte(monthStart.ts).and(cmd.lt(monthEnd.ts))
    })
      .get()
      .then(({ data }) => {
        const records = []
        const monthStartWeekday = monthStart.weekday
        const placeholdersNum = monthStartWeekday === 7 ? 0 : monthStartWeekday
        for (let i = 0; i < placeholdersNum; i++) {
          records.push(null)
        }
        for (let ts = monthStart.ts, day = 1; ts < monthEnd.ts; ts += 1000 * 60 * 60 * 24, day++) {
          const record = find(data, v => v.date === ts)
          const _record = { _day: day, date: ts }
          records.push(Object.assign({}, record, _record))
        }
        this.setData({
          records: chunk(records, 7)
        })
      })
      .finally(() => {
        wx.hideLoading()
      })
  },
  prepareViewData () {
    this.setData({
      currentDateStr: this.data.currentDate.toFormat('yyyy年L月'),
      prevDateStr: this.data.currentDate.minus({ months: 1 }).toFormat('yyyy年L月'),
      nextDateStr: this.data.currentDate.plus({ months: 1 }).toFormat('yyyy年L月')
    })
  },
  goPrevMonth () {
    this.setData({
      currentDate: this.data.currentDate.minus({ months: 1 })
    }, () => {
      this.fetchData().then(this.prepareViewData)
    })
  },
  goNextMonth () {
    this.setData({
      currentDate: this.data.currentDate.plus({ months: 1 })
    }, () => {
      this.fetchData().then(this.prepareViewData)
    })
  },
  goDay ({ currentTarget: { dataset: { value } } }) {
    app.globalData.needRelocate = value
    wx.navigateBack()
  },
})
