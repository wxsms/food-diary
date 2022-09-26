import { DIARY_OPTION_LIST, DIARY_TYPES } from '../../constants/constants'
import { isR, version } from '../../utils/version.utils'
import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import { store } from '../../store/store'
import { nextTick } from '../../utils/wx.utils'
import { debug, error } from '../../utils/log.utils'
import { minusDay, startOfMonth } from '../../utils/date.utils'
import { loading, toast, TOAST_ERRORS } from '../../utils/toast.utils'
import themeMixin from '../../mixins/theme.mixin'
import shareMixin from '../../mixins/share.mixin'
import find from 'lodash.find'
import { getOpenId } from '../../utils/auth.utils'

Component({
  behaviors: [storeBindingsBehavior, themeMixin, shareMixin],
  data: {
    yesterdayData: null,
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
      currentDateTs: store => store.currentDateTs,
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
      wx.showModal({
        title: '重要提醒',
        showCancel: false,
        confirmText: '我知道了',
        content: '由于微信小程序收费政策调整，且调整后每月收费昂贵，IBD 日记已无法继续为病友们提供免费服务。服务将于 2022 年 10 月 23 日下线。请各位用户在此日期之前自行完成数据导出与备份，超过时限后数据将被云服务提供商自动清理。小程序已取消每天一次的导出限制，请知悉！',
        success (res) {
          if (res.confirm) {
            console.log('用户点击确定')
          } else if (res.cancel) {
            console.log('用户点击取消')
          }
        }
      })
      debug('version:', version)
      debug('index:onLoad')
      loading()
      const r = await isR()
      const _options = (r ? DIARY_OPTION_LIST.filter(v => v.r) : DIARY_OPTION_LIST).map((v, i) => {
        // const text = v.desc ? `${v.label}（${v.desc}）` : v.label
        const text = v.label
        const isAbnormal = v.key === DIARY_TYPES.ABNORMAL.key
        return {
          ...v,
          text: text,
          value: i,
          type: isAbnormal ? 'warn' : undefined
        }
      })
      debug('options:', _options)
      this.setData({
        options: _options
      })
      await nextTick()
      await this.fetchData()
    },
    async onShow () {
      debug('index:onShow')
      if (this.tsBeforeLeave && this.tsBeforeLeave !== this.data.currentDateTs) {
        debug('ts changed, fetch today data...')
        wx.pageScrollTo({
          scrollTop: 0
        })
        await this.fetchData()
      }
      this.tsBeforeLeave = null
    },
    async copyYesterday () {
      try {
        loading()
        const db = wx.cloud.database()
        const params = {
          ...this.data.yesterdayData,
          date: this.data.currentDateTs
        }
        delete params._openid
        delete params._id
        const { _id } = await db.collection('records').add({
          data: params
        })
        if (_id) {
          this.setTodayRecord({
            ...params,
            _id,
          })
        } else {
          toast(TOAST_ERRORS.NETWORK_ERR)
        }
      } catch (e) {
        error(e)
        toast(TOAST_ERRORS.NETWORK_ERR)
      } finally {
        loading(false)
      }
    },
    async fetchData () {
      try {
        loading()
        const db = wx.cloud.database()
        const _ = db.command
        const currentDateTs = this.data.currentDateTs
        const yesterdayTs = minusDay(this.data.currentDate).ts
        const openid = await getOpenId()
        const { data } = await db
          .collection('records')
          .where({
            _openid: openid,
            date: _.eq(yesterdayTs).or(_.eq(currentDateTs))
          })
          .orderBy('date', 'asc')
          .get()
        // debug(data)
        const yesterdayData = find(data, v => v.date === yesterdayTs) || null
        const record = find(data, v => v.date === currentDateTs) || null
        // debug(yesterdayData, record)
        this.setTodayRecord(record)
        this.setData({ yesterdayData })
      } catch (e) {
        error(e)
        toast(TOAST_ERRORS.NETWORK_ERR)
      } finally {
        loading(false)
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
        url: `/pages/modules/diary/pages/edit/edit?diaryOptionIndex=${index}`
      })
    },
    async goCalendar () {
      this.tsBeforeLeave = this.data.currentDateTs
      this.setCurrentMonth(startOfMonth(this.data.currentDate))
      await nextTick()
      wx.navigateTo({
        url: `/pages/modules/diary/pages/calendar/calendar`
      })
    }
  }
})
