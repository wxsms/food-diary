import { DIARY_OPTION_LIST } from '../../constants/index'
import { isReview, version } from '../../utils/version.utils'
import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import { store } from '../../store/store'
import { nextTick } from '../../utils/wx.utils'
import { debug, error } from '../../utils/log.utils'
import { minusDay, startOfMonth } from '../../utils/date.utils'
import { loading, toast, TOAST_ERRORS } from '../../utils/toast.utils'
import themeMixin from '../../mixins/theme.mixin'
import shareMixin from '../../mixins/share.mixin'

const app = getApp()

Component({
  behaviors: [storeBindingsBehavior, themeMixin, shareMixin],
  data: {
    logged: false,
    yesterdayData: null,
    isReview: false,
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
      currentDate: store => store.currentDate,
      todayRecord: store => store.todayRecord
    },
    actions: {
      setCurrentDate: 'setCurrentDate',
      setCurrentMonth: 'setCurrentMonth',
      setTodayRecord: 'setTodayRecord'
    }
  },
  methods: {
    async onLoad () {
      debug('version:', version)
      debug('index:onLoad')
      loading()
      const _isReview = await isReview()
      const _options = (_isReview ? DIARY_OPTION_LIST.filter(v => v.inReviewMode) : DIARY_OPTION_LIST).map((v, i) => ({
        ...v,
        text: v.label,
        value: i
      }))
      debug('options:', _options)
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
      if (this.data.todayRecord && this.data.todayRecord.date !== this.data.currentDate.ts) {
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
            date: this.data.currentDate.ts
          }
        })
      } catch (e) {
        error(e)
        toast(TOAST_ERRORS.NETWORK_ERR)
      } finally {
        await this.fetchData()
      }
    },
    async fetchData () {
      try {
        loading()
        const db = wx.cloud.database()
        const _ = db.command
        const currentDateTs = this.data.currentDate.ts
        const yesterdayTs = minusDay(this.data.currentDate).ts
        const { data } = await db
          .collection('records')
          .where({
            _openid: app.globalData.openid,
            date: _.eq(yesterdayTs).or(_.eq(currentDateTs))
          })
          .orderBy('date', 'asc')
          .get()
        // debug(data)
        const yesterdayData = data[0] || null
        const record = data[1] || null
        this.setTodayRecord(record)
        this.setData({ yesterdayData })
      } catch (e) {
        error(e)
        toast(TOAST_ERRORS.NETWORK_ERR)
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
        toast(TOAST_ERRORS.NETWORK_ERR)
        error('[云函数] [login] 调用失败', err)
      }
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
