import { DateTime } from 'luxon'
import { DIARY_OPTION_LIST } from '../../../constants/index'

const app = getApp()

Page({
  data: {
    type: null,
    date: null,
    dateStr: '',
    record: null,
    value: ''
  },
  onLoad ({ diaryOptionIndex, ts }) {
    wx.showLoading({
      mask: true,
      title: '加载中...'
    })
    this.setData({
      type: DIARY_OPTION_LIST[Number(diaryOptionIndex)],
      date: DateTime.fromMillis(Number(ts))
    }, () => {
      this.prepareViewData()
      this.fetchData()
    })
  },
  fetchData () {
    const db = wx.cloud.database()
    db.collection('records').where({
      _openid: app.globalData.openid,
      date: this.data.date.toFormat('yyyy/LL/dd')
    })
      .get()
      .then(({ data }) => {
        const record = data[0]
        if (record) {
          this.setData({
            record,
            value: record[this.data.type.key] || ''
          })
        }
      })
      .finally(() => {
        wx.hideLoading()
      })
  },
  prepareViewData () {
    this.setData({
      dateStr: this.data.date.toFormat('yyyy年L月d日')
    })
  },
  doSave (e) {
    if (!e.detail.value.record) {
      wx.showToast({
        title: '写点东西吧',
        icon: 'none',
        duration: 2000
      })
      return
    }
    wx.showLoading({
      mask: true,
      title: '正在保存...'
    })
    const db = wx.cloud.database()
    if (this.data.record) {
      db.collection('records').doc(this.data.record._id).update({
        data: {
          [this.data.type.key]: e.detail.value.record
        }
      })
        .then(res => {
          app.globalData.needReload = true
          wx.navigateBack()
        })
        .finally(() => {
          wx.hideLoading()
        })
    } else {
      db.collection('records').add({
        // data 字段表示需新增的 JSON 数据
        data: {
          date: this.data.date.toFormat('yyyy/LL/dd'),
          [this.data.type.key]: e.detail.value.record
        }
      })
        .then(res => {
          app.globalData.needReload = true
          wx.navigateBack()
        })
        .finally(() => {
          wx.hideLoading()
        })
    }
  },
  deleteRecord () {
    if (!this.data.record) {
      return
    }
    wx.showModal({
      title: '确认',
      content: '记录删除后将无法恢复',
      confirmText: '删除',
      confirmColor: '#fa5151',
      cancelText: '取消',
      success: ({ confirm }) => {
        if (confirm) {
          wx.showLoading({
            mask: true,
            title: '正在删除...'
          })
          let keyCount = 0
          DIARY_OPTION_LIST.forEach(v => {
            if (v.key !== this.data.type.key && this.data.record[v.key]) {
              keyCount++
            }
          })
          const db = wx.cloud.database()
          if (keyCount > 0) {
            db.collection('records').doc(this.data.record._id).update({
              data: {
                [this.data.type.key]: ''
              }
            })
              .then(res => {
                app.globalData.needReload = true
                wx.navigateBack()
              })
              .finally(() => {
                wx.hideLoading()
              })
          } else {
            db.collection('records').doc(this.data.record._id).remove()
              .then(res => {
                app.globalData.needReload = true
                wx.navigateBack()
              })
              .finally(() => {
                wx.hideLoading()
              })
          }
        }
      }
    })
  }
})
