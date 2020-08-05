import { DateTime } from 'luxon'
import { DIARY_OPTION_LIST, DIARY_TYPES } from '../../constants/index'
import { getCache, cacheInput, cacheDelete } from '../../store/recent-record.store'
import { isReview } from '../../utils/version.utils'
import { getByLevel, SCD_LEVEL } from '../../store/scd-foods.store'

const app = getApp()

Page({
  data: {
    type: null,
    showWeight: false,
    showDefecation: false,
    date: null,
    dateStr: '',
    record: null,
    value: '',
    recent: [],
    othersRecent: ['体重', '排便', '异常'],
    scdFoods: [],
    isReview: false,
    loaded: false
  },
  async onLoad ({ diaryOptionIndex, ts }) {
    wx.showLoading({
      mask: true,
      title: '加载中...'
    })
    const type = DIARY_OPTION_LIST[Number(diaryOptionIndex)]
    this.setData({
      type,
      showWeight: type === DIARY_TYPES.OTHERS,
      showDefecation: type === DIARY_TYPES.OTHERS,
      date: DateTime.fromMillis(Number(ts)).startOf('day'),
      recent: getCache(type.key)
    }, async () => {
      this.prepareViewData()
      await this.fetchScdData()
      this.fetchData()
    })
  },
  async fetchScdData () {
    try {
      const _isReview = await isReview()
      if (_isReview) {
        let _scdFoods = []
        const data = await Promise.all([
          getByLevel(SCD_LEVEL.LV_0),
          getByLevel(SCD_LEVEL.LV_1),
          getByLevel(SCD_LEVEL.LV_2)
        ])
        data.forEach(v => {
          _scdFoods = _scdFoods.concat(v.map(v => v.name))
        })
        this.setData({
          loaded: true,
          scdFoods: _scdFoods,
          isReview: _isReview
        })
      } else {
        this.setData({
          loaded: true
        })
      }
    } catch (e) {
      console.error(e)
    }
  },
  fetchData () {
    const db = wx.cloud.database()
    db.collection('records').where({
      _openid: app.globalData.openid,
      date: this.data.date.ts
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
  onChange ({ detail: { value } }) {
    this.setData({ value })
  },
  onRecentClick ({ currentTarget: { dataset: { value } } }) {
    this.setData({
      value: (this.data.value + '\n' + value).trim()
    })
  },
  onRecentDelete ({ currentTarget: { dataset: { value } } }) {
    wx.showModal({
      content: '删除本项？',
      confirmText: '删除',
      confirmColor: '#fa5151',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            recent: cacheDelete(this.data.type.key, value)
          })
        }
      }
    })
  },
  doSave () {
    if (!this.data.value) {
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
          [this.data.type.key]: this.data.value
        }
      })
        .then(res => {
          cacheInput(this.data.type.key, this.data.value)
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
          date: this.data.date.ts,
          [this.data.type.key]: this.data.value
        }
      })
        .then(res => {
          cacheInput(this.data.type.key, this.data.value)
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
  },
  onScdFoodChange ({ detail: { value } }) {
    this.setData({
      value: (this.data.value + '\n' + this.data.scdFoods[value]).trim()
    })
  }
})