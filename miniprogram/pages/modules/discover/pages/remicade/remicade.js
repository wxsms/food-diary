import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import themeMixin from '../../../../../mixins/theme.mixin'
import shareMixin from '../../../../../mixins/share.mixin'
import { loading, toast, TOAST_ERRORS } from '../../../../../utils/toast.utils'
import { debug, error } from '../../../../../utils/log.utils'
import { store } from '../../../../../store/store'
import { addWeek, format, FORMATS } from '../../../../../utils/date.utils'

Component({
  behaviors: [storeBindingsBehavior, themeMixin, shareMixin],
  storeBindings: {
    store,
    fields: {
      remicadeRecords: store => store.remicadeRecords
    },
    actions: {
      setRemicadeRecords: 'setRemicadeRecords'
    }
  },
  data: {
    nextTime: '',
    nextDate: '',
    nextSplit: 8,
  },
  observers: {
    'remicadeRecords' (remicadeRecords) {
      const records = remicadeRecords.slice()
      if (records && records.length) {
        const prevTime = records[0].time
        const prevDate = records[0].date
        let nextSplit = 8
        if (prevTime === 1) {
          nextSplit = 2
        } else if (prevTime === 2) {
          nextSplit = 4
        }
        const date = new Date(prevDate)
        const ts = date.getTime()
        const nextDate = format(addWeek(ts, nextSplit), FORMATS.Y_M_D)
        this.setData({
          nextTime: prevTime + 1,
          nextDate,
          nextSplit
        })
      }
    }
  },
  methods: {
    async onLoad () {
      await this.fetchData()
    },
    async fetchData () {
      try {
        loading()
        const { result } = await wx.cloud.callFunction({
          name: 'remicade'
        })
        this.setRemicadeRecords(result || [])
      } catch (e) {
        error(e)
        toast(TOAST_ERRORS.NETWORK_ERR)
      } finally {
        loading(false)
      }
    },
    goEdit ({ currentTarget: { dataset: { id } } }) {
      wx.navigateTo({
        url: `/pages/modules/discover/pages/remicade/remicade-edit?id=${id}`
      })
    },
    goAdd () {
      wx.navigateTo({
        url: `/pages/modules/discover/pages/remicade/remicade-edit`
      })
    }
  }
})
