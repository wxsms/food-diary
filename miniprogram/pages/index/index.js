import { DateTime } from 'luxon'
import { DIARY_OPTION_LIST, DIARY_TYPES } from '../../constants/index'
import { isReview } from '../../utils/version.utils'
import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import { store } from '../../store/store'
import { nextTick } from '../../utils/wx.utils'

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
      currentDateStr: (store) => store.currentDateStr,
      currentDateWeekDay: (store) => store.currentDateWeekDay,
      prevDateStr: (store) => store.prevDateStr,
      nextDateStr: (store) => store.nextDateStr,
      currentDateTs: (store) => store.currentDateTs
    },
    actions: {
      setCurrentDateTs: 'setCurrentDateTs'
    }
  },
  methods: {
    async onLoad () {
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
      if (app.globalData.needReload) {
        app.globalData.needReload = false
        await this.fetchData()
      } else if (app.globalData.needRelocate) {
        this.setCurrentDateTs(DateTime.fromMillis(app.globalData.needRelocate).ts)
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
            date: this.data.currentDateTs
          }
        })
      } catch (e) {
        console.error(e)
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
            date: this.data.currentDateTs
          }).get(),
          db.collection('records').where({
            _openid: app.globalData.openid,
            date: DateTime.fromMillis(this.data.currentDateTs).minus({ days: 1 }).ts
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
        console.error(e)
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
        console.log('[云函数] [login] user openid: ', res.result.openid)
        app.globalData.openid = res.result.openid
        this.setData({
          logged: true
        })
      } catch (err) {
        console.error('[云函数] [login] 调用失败', err)
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
            wx.navigateTo({
              url: `/pages/edit/edit?diaryOptionIndex=${tapIndex}&ts=${this.data.currentDateTs}`
            })
          }
        }
      })
    },
    goEditBreakfast () {
      wx.navigateTo({
        url: `/pages/edit/edit?diaryOptionIndex=${DIARY_OPTION_LIST.indexOf(DIARY_TYPES.BREAKFAST)}&ts=${this.data.currentDateTs}`
      })
    },
    goEditLunch () {
      wx.navigateTo({
        url: `/pages/edit/edit?diaryOptionIndex=${DIARY_OPTION_LIST.indexOf(DIARY_TYPES.LUNCH)}&ts=${this.data.currentDateTs}`
      })
    },
    goEditDinner () {
      wx.navigateTo({
        url: `/pages/edit/edit?diaryOptionIndex=${DIARY_OPTION_LIST.indexOf(DIARY_TYPES.DINNER)}&ts=${this.data.currentDateTs}`
      })
    },
    goEditSupplement () {
      wx.navigateTo({
        url: `/pages/edit/edit?diaryOptionIndex=${DIARY_OPTION_LIST.indexOf(DIARY_TYPES.SUPPLEMENT)}&ts=${this.data.currentDateTs}`
      })
    },
    goEditOthers () {
      wx.navigateTo({
        url: `/pages/edit/edit?diaryOptionIndex=${DIARY_OPTION_LIST.indexOf(DIARY_TYPES.OTHERS)}&ts=${this.data.currentDateTs}`
      })
    },
    goEditAbnormal () {
      wx.navigateTo({
        url: `/pages/edit/edit?diaryOptionIndex=${DIARY_OPTION_LIST.indexOf(DIARY_TYPES.ABNORMAL)}&ts=${this.data.currentDateTs}`
      })
    },
    goCalendar () {
      wx.navigateTo({
        url: `/pages/calendar/calendar?ts=${this.data.currentDateTs}`
      })
    }
  }
})
