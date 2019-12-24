import { DateTime } from 'luxon'
import { DIARY_OPTION_LIST } from '../../constants/index'

const app = getApp()

Page({
  data: {
    logged: false,
    currentDate: null,
    currentDateStr: '',
    currentDateWeekDay: '',
    prevDateStr: '',
    nextDateStr: ''
  },
  onLoad () {
    this.getOpenid()
    this.setData({
      currentDate: DateTime.local()
    }, () => {
      this.prepareViewData()
    })
  },
  getOpenid () {
    // 调用云函数
    wx.cloud.callFunction({
      name: 'login',
      data: {},
      success: res => {
        console.log('[云函数] [login] user openid: ', res.result.openid)
        app.globalData.openid = res.result.openid
        this.setData({
          logged: true
        })
      },
      fail: err => {
        console.error('[云函数] [login] 调用失败', err)
      }
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
    }, this.prepareViewData)
  },
  goNextDay () {
    this.setData({
      currentDate: this.data.currentDate.plus({ days: 1 })
    }, () => {
      this.prepareViewData()
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
  }
})
