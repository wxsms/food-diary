import { DateTime } from 'luxon'
import { DIARY_OPTION_LIST, DIARY_TYPES } from '../../constants/index'

const app = getApp()

Page({
  data: {
    logged: false,
    currentDate: null,
    currentDateStr: '',
    currentDateWeekDay: '',
    prevDateStr: '',
    nextDateStr: '',
    record: null,
    yesterdayData: null
  },
  onLoad () {
    this.setData({
      currentDate: DateTime.local().startOf('day')
    }, this.prepareViewData)
    wx.showLoading({
      mask: true,
      title: '加载中...'
    })
    this.login().then(this.fetchData)
  },
  onShow () {
    if (app.globalData.needReload) {
      app.globalData.needReload = false
      this.fetchData()
    } else if (app.globalData.needRelocate) {
      this.setData({
        currentDate: DateTime.fromMillis(app.globalData.needRelocate)
      }, () => {
        app.globalData.needRelocate = null
        this.fetchData().then(this.prepareViewData)
      })
    }
  },
  copyYesterday () {
    wx.showLoading({
      mask: true,
      title: '请稍候...'
    })
    const _data = this.data.yesterdayData
    delete _data._openid
    delete _data._id
    const db = wx.cloud.database()
    db.collection('records').add({
      data: {
        ..._data,
        date: this.data.currentDate.startOf('day').ts
      }
    })
      .finally(this.fetchData)
  },
  fetchData () {
    wx.showLoading({
      mask: true,
      title: '加载中...'
    })
    const db = wx.cloud.database()
    return Promise.all([
      db.collection('records').where({
        _openid: app.globalData.openid,
        date: this.data.currentDate.startOf('day').ts
      }).get(),
      db.collection('records').where({
        _openid: app.globalData.openid,
        date: this.data.currentDate.startOf('day').minus({ days: 1 }).ts
      }).get()
    ])
      .then(res => {
        const record = res[0].data[0] || null
        const yesterdayData = res[1].data[0] || null
        this.setData({
          record,
          yesterdayData
        })
      })
      .finally(() => {
        wx.hideLoading()
      })
  },
  login () {
    // 调用云函数
    return wx.cloud.callFunction({
      name: 'login',
      data: {}
    })
      .then(res => {
        console.log('[云函数] [login] user openid: ', res.result.openid)
        app.globalData.openid = res.result.openid
        this.setData({
          logged: true
        })
      })
      .catch(err => {
        console.error('[云函数] [login] 调用失败', err)
      })
  },
  prepareViewData () {
    this.setData({
      currentDateStr: this.data.currentDate.toFormat('yyyy年L月d日'),
      currentDateWeekDay: this.data.currentDate.weekdayLong,
      prevDateStr: this.data.currentDate.minus({ days: 1 }).toFormat('L月d日'),
      nextDateStr: this.data.currentDate.plus({ days: 1 }).toFormat('L月d日')
    })
  },
  goPrevDay () {
    this.setData({
      currentDate: this.data.currentDate.minus({ days: 1 })
    }, () => {
      this.fetchData()
        .then(this.prepareViewData)
    })
  },
  goNextDay () {
    this.setData({
      currentDate: this.data.currentDate.plus({ days: 1 })
    }, () => {
      this.fetchData()
        .then(this.prepareViewData)
    })
  },
  showAddSheet () {
    wx.showActionSheet({
      itemList: DIARY_OPTION_LIST.map(v => v.label),
      success: ({ cancel, tapIndex }) => {
        if (!cancel) {
          wx.navigateTo({
            url: `/pages/index/edit/index?diaryOptionIndex=${tapIndex}&ts=${this.data.currentDate.ts}`
          })
        }
      }
    })
  },
  goEditBreakfast () {
    wx.navigateTo({
      url: `/pages/index/edit/index?diaryOptionIndex=${DIARY_OPTION_LIST.indexOf(DIARY_TYPES.BREAKFAST)}&ts=${this.data.currentDate.ts}`
    })
  },
  goEditLunch () {
    wx.navigateTo({
      url: `/pages/index/edit/index?diaryOptionIndex=${DIARY_OPTION_LIST.indexOf(DIARY_TYPES.LUNCH)}&ts=${this.data.currentDate.ts}`
    })
  },
  goEditDinner () {
    wx.navigateTo({
      url: `/pages/index/edit/index?diaryOptionIndex=${DIARY_OPTION_LIST.indexOf(DIARY_TYPES.DINNER)}&ts=${this.data.currentDate.ts}`
    })
  },
  goEditSupplement () {
    wx.navigateTo({
      url: `/pages/index/edit/index?diaryOptionIndex=${DIARY_OPTION_LIST.indexOf(DIARY_TYPES.SUPPLEMENT)}&ts=${this.data.currentDate.ts}`
    })
  },
  goEditOthers () {
    wx.navigateTo({
      url: `/pages/index/edit/index?diaryOptionIndex=${DIARY_OPTION_LIST.indexOf(DIARY_TYPES.OTHERS)}&ts=${this.data.currentDate.ts}`
    })
  },
  goEditAbnormal () {
    wx.navigateTo({
      url: `/pages/index/edit/index?diaryOptionIndex=${DIARY_OPTION_LIST.indexOf(DIARY_TYPES.ABNORMAL)}&ts=${this.data.currentDate.ts}`
    })
  },
  goCalendar () {
    wx.navigateTo({
      url: `/pages/index/calendar/index?ts=${this.data.currentDate.ts}`
    })
  }
})
