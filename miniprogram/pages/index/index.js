import { DateTime } from 'luxon'
import { DIARY_OPTION_LIST, DIARY_TYPES } from '../../constants/index'
import { isReview } from '../../utils/version.utils'
import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import { store } from '../../store/store'
import { nextTick } from '../../utils/wx.utils'
import { debug, error } from '../../utils/log.utils'
import { minusDay } from '../../utils/date.utils'

const app = getApp()

Component({
  behaviors: [storeBindingsBehavior],
  data: {
    logged: false,
    record: null,
    yesterdayData: null,
    isReview: false,
    hasDefecation: false,
    hasWeight: false
  },
  storeBindings: {
    store,
    fields: {
      currentDateStr: store => store.currentDateStr,
      currentDateWeekDayStr: store => store.currentDateWeekDayStr,
      prevDateStr: store => store.prevDateStr,
      nextDateStr: store => store.nextDateStr,
      currentDate: store => store.currentDate
    },
    actions: {
      setCurrentDate: 'setCurrentDate'
    }
  },
  methods: {
    async onLoad () {
      debug('index:onLoad')
      wx.showLoading({
        mask: true,
        title: '加载中...'
      })
      const _isReview = await isReview()
      this.setData({
        isReview: _isReview
      })
      await this.login()
      await this.fetchData()
    },
    async onShow () {
      debug('index:onShow')
      if (app.globalData.needReload) {
        app.globalData.needReload = false
        await this.fetchData()
      } else if (app.globalData.needRelocate) {
        this.setCurrentDate(DateTime.fromMillis(app.globalData.needRelocate).ts)
        app.globalData.needRelocate = null
        await nextTick()
        await this.fetchData()
      }
    },
    async copyYesterday () {
      try {
        wx.showLoading({
          mask: true,
          title: '请稍候...'
        })
        const _data = this.data.yesterdayData
        delete _data._openid
        delete _data._id
        const db = wx.cloud.database()
        await db.collection('records').add({
          data: {
            ..._data,
            date: this.data.currentDate
          }
        })
      } catch (e) {
        error(e)
      } finally {
        await this.fetchData()
      }
    },
    async fetchData () {
      try {
        wx.showLoading({
          mask: true,
          title: '加载中...'
        })
        const db = wx.cloud.database()
        const res = await Promise.all([
          db.collection('records').where({
            _openid: app.globalData.openid,
            date: this.data.currentDate.ts
          }).get(),
          db.collection('records').where({
            _openid: app.globalData.openid,
            date: minusDay(this.data.currentDate).ts
          }).get()
        ])
        const record = res[0].data[0] || null
        const yesterdayData = res[1].data[0] || null
        this.setData({
          record,
          hasDefecation: record && typeof record.defecation === 'number',
          hasWeight: record && typeof record.weight === 'number',
          yesterdayData
        })
      } catch (e) {
        error(e)
      } finally {
        wx.hideLoading()
      }
    },
    async login () {
      // 调用云函数
      try {
        const res = await wx.cloud.callFunction({
          name: 'login',
          data: {}
        })
        debug('[云函数] [login] user openid: ', res.result.openid)
        app.globalData.openid = res.result.openid
        this.setData({
          logged: true
        })
      } catch (err) {
        error('[云函数] [login] 调用失败', err)
      }
    },
    async goPrevDay () {
      await this.fetchData()
    },
    async goNextDay () {
      await this.fetchData()
    },
    showAddSheet () {
      const list = this.data.isReview ? DIARY_OPTION_LIST.filter(v => v.inReviewMode) : DIARY_OPTION_LIST
      wx.showActionSheet({
        itemList: list.map(v => v.label),
        success: ({ cancel, tapIndex }) => {
          if (!cancel) {
            this._goEdit(tapIndex)
          }
        }
      })
    },
    goEdit ({ currentTarget: { dataset: { index } } }) {
      this._goEdit(index)
    },
    _goEdit (index) {
      debug('goEdit', index, DIARY_OPTION_LIST[index])
      wx.navigateTo({
        url: `/pages/edit/edit?diaryOptionIndex=${index}&ts=${this.data.currentDate}`
      })
    },
    goCalendar () {
      wx.navigateTo({
        url: `/pages/calendar/calendar`
      })
    }
  }
})
