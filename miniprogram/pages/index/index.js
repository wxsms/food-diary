import { DIARY_OPTION_LIST } from '../../constants/index'
import { isReview } from '../../utils/version.utils'
import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import { store } from '../../store/store'
import { nextTick } from '../../utils/wx.utils'
import { debug, error } from '../../utils/log.utils'
import { minusDay, startOfMonth } from '../../utils/date.utils'
import { loading } from '../../utils/toast.utils'
import theme from '../../mixins/theme.mixin'

const app = getApp()

Component({
  behaviors: [storeBindingsBehavior, theme],
  data: {
    logged: false,
    record: null,
    yesterdayData: null,
    isReview: false,
    hasDefecation: false,
    hasWeight: false,
    showActionSheet: false,
    options: []
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
      setCurrentDate: 'setCurrentDate',
      setCurrentMonth: 'setCurrentMonth'
    }
  },
  methods: {
    onShareAppMessage () {
      return {
        title: 'IBD日记',
        path: '/pages/index/index'
      }
    },
    async onLoad () {
      debug('index:onLoad')
      loading()
      const _isReview = await isReview()
      const _options = (_isReview ? DIARY_OPTION_LIST.filter(v => v.inReviewMode) : DIARY_OPTION_LIST).map((v, i) => ({
        text: v.label,
        value: i
      }))
      this.setData({
        isReview: _isReview,
        options: _options
      })
      await nextTick()
      await this.login()
      await this.fetchData()
    },
    async onShow () {
      debug('index:onShow')
      if (app.globalData.needReload) {
        app.globalData.needReload = false
        await this.fetchData()
      } else if (this.data.record && this.data.record.date !== this.data.currentDate.ts) {
        wx.pageScrollTo({
          scrollTop: 0
        })
        await this.fetchData()
      }
    },
    async copyYesterday () {
      try {
        loading()
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
        loading()
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
        loading(false)
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
      this.setData({
        showActionSheet: true
      })
    },
    goEdit ({ currentTarget: { dataset: { index } }, detail: { value } }) {
      const isFromActionSheet = typeof value === 'number'
      if (isFromActionSheet) {
        this.setData({
          showActionSheet: false
        })
      }
      this._goEdit(isFromActionSheet ? value : index)
    },
    _goEdit (index) {
      debug('goEdit', index, DIARY_OPTION_LIST[index])
      wx.navigateTo({
        url: `/pages/edit/edit?diaryOptionIndex=${index}`
      })
    },
    async goCalendar () {
      this.setCurrentMonth(startOfMonth(this.data.currentDate))
      await nextTick()
      wx.navigateTo({
        url: `/pages/calendar/calendar`
      })
    }
  }
})
