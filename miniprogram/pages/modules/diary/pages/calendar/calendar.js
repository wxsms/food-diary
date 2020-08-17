import find from 'lodash.find'
import chunk from 'lodash.chunk'
import { debug, error } from '../../../../../utils/log.utils'
import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import { store } from '../../../../../store/store'
import { getWeekday } from '../../../../../utils/date.utils'
import { nextTick } from '../../../../../utils/wx.utils'
import { loading, toast, TOAST_ERRORS } from '../../../../../utils/toast.utils'
import themeMixin from '../../../../../mixins/theme.mixin'
import shareMixin from '../../../../../mixins/share.mixin'
import { exportAndDownloadRecords } from '../../../../../utils/export.utils'

Component({
  behaviors: [storeBindingsBehavior, themeMixin, shareMixin],
  data: {
    records: [],
    hasRecordInMonth: false
  },
  storeBindings: {
    store,
    fields: {
      monthStart: store => store.monthStart,
      monthEnd: store => store.monthEnd
    },
    actions: {
      setCurrentDate: 'setCurrentDate'
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
        toast(TOAST_ERRORS.NETWORK_ERR)
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
    goDay ({ currentTarget: { dataset: { value } } }) {
      this.setCurrentDate(value)
      wx.navigateBack()
    },
    async exportData () {
      const { monthStart, monthEnd } = this.data
      await exportAndDownloadRecords({ from: monthStart.ts, to: monthEnd.ts })
    }
  }
})
