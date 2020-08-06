import find from 'lodash.find'
import chunk from 'lodash.chunk'
import { promisify } from '../../utils/promisify.utils'
import { debug, error } from '../../utils/log.utils'
import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import { store } from '../../store/store'
import { addMonth, getWeekday, minusMonth } from '../../utils/date.utils'
import { nextTick } from '../../utils/wx.utils'
import { loading } from '../../utils/toast.utils'

const app = getApp()

Component({
  behaviors: [storeBindingsBehavior],
  data: {
    records: [],
    hasRecordInMonth: false
  },
  storeBindings: {
    store,
    fields: {
      currentMonth: store => store.currentMonth,
      currentMonthStr: store => store.currentMonthStr,
      prevMonthStr: store => store.prevMonthStr,
      nextMonthStr: store => store.nextMonthStr,
      monthStart: store => store.monthStart,
      monthEnd: store => store.monthEnd
    },
    actions: {
      setCurrentMonth: 'setCurrentMonth'
    }
  },
  methods: {
    async onLoad () {
      debug('calendar:onLoad')
      loading()
      await nextTick()
      this.prepareGrid()
      await this.fetchData()
    },
    async fetchData () {
      try {
        const { monthStart, monthEnd } = this.data
        loading()
        const { result: { data } } = await wx.cloud.callFunction({
          name: 'calendar',
          data: {
            from: monthStart.ts,
            to: monthEnd.ts
          }
        })
        this.setData({
          hasRecordInMonth: data.length > 0
        })
        this.prepareGrid(data)
      } catch (e) {
        error(e)
      } finally {
        loading(false)
      }
    },
    prepareGrid (data = []) {
      const { monthStart, monthEnd } = this.data
      const records = []
      // debug('monthStart', monthStart)
      const monthStartWeekday = getWeekday(monthStart)
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
    async goPrevMonth () {
      this.setCurrentMonth(minusMonth(this.data.currentMonth))
      await nextTick()
      await this.fetchData()
    },
    async goNextMonth () {
      this.setCurrentMonth(addMonth(this.data.currentMonth))
      await nextTick()
      await this.fetchData()
    },
    goDay ({ currentTarget: { dataset: { value } } }) {
      app.globalData.needRelocate = value
      wx.navigateBack()
    },
    async exportData () {
      const { monthStart, monthEnd } = this.data
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
  }
})
