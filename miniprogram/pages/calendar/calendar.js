import { DateTime } from 'luxon'
import find from 'lodash.find'
import chunk from 'lodash.chunk'
import { promisify } from '../../utils/promisify.utils'
import { error } from '../../utils/log.utils'

const app = getApp()

Page({
  data: {
    currentDate: null,
    currentDateStr: '',
    prevDateStr: '',
    nextDateStr: '',
    records: [],
    hasRecordInMonth: false
  },
  onLoad ({ ts }) {
    this.setData({
      currentDate: DateTime.fromMillis(Number(ts)).startOf('day')
    }, () => {
      this.prepareGrid()
      this.prepareViewData()
      this.fetchData()
    })
  },
  fetchData () {
    wx.showLoading({
      mask: true,
      title: '加载中...'
    })
    const monthStart = this.data.currentDate.startOf('month')
    const monthEnd = this.data.currentDate.endOf('month')
    return wx.cloud.callFunction({
      name: 'calendar',
      data: {
        from: monthStart.ts,
        to: monthEnd.ts
      }
    })
      .then(({ result: { data } }) => {
        this.setData({
          hasRecordInMonth: data.length > 0
        })
        this.prepareGrid(data)
      })
      .finally(() => {
        wx.hideLoading()
      })
  },
  prepareGrid (data = []) {
    const monthStart = this.data.currentDate.startOf('month')
    const monthEnd = this.data.currentDate.endOf('month')
    const records = []
    const monthStartWeekday = monthStart.weekday
    const placeholdersNum = monthStartWeekday === 7 ? 0 : monthStartWeekday
    for (let i = 0; i < placeholdersNum; i++) {
      records.push(null)
    }
    for (let ts = monthStart.ts, day = 1; ts < monthEnd.ts; ts += 1000 * 60 * 60 * 24, day++) {
      const record = find(data, v => v.date === ts)
      const _record = {
        _day: day,
        date: ts,
        hasWeight: record && typeof record.weight === 'number',
        hasDefecation: record && typeof record.defecation === 'number'
      }
      records.push(Object.assign({}, record, _record))
    }
    this.setData({
      records: chunk(records, 7)
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
  async exportData () {
    const monthStart = this.data.currentDate.startOf('month')
    const monthEnd = this.data.currentDate.endOf('month')
    try {
      wx.showLoading({
        mask: true,
        title: '导出中...'
      })
      const { result } = await wx.cloud.callFunction({
        name: 'export',
        data: {
          from: monthStart.ts,
          to: monthEnd.ts
        }
      })
      const { tempFilePath } = await promisify(wx.downloadFile, { url: result })
      await promisify(wx.openDocument, {
        filePath: tempFilePath,
        fileType: 'xlsx',
        showMenu: true
      })
    } catch (e) {
      error(e)
      wx.showToast({
        title: '出错啦，请稍后重试',
        icon: 'none',
        duration: 2000
      })
    } finally {
      wx.hideLoading()
    }
  }
})
