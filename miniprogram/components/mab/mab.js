import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { loading, toast, TOAST_ERRORS } from '../../utils/toast.utils'
import { debug, error } from '../../utils/log.utils'
import { store } from '../../store/store'
import { addWeek, format, FORMATS } from '../../utils/date.utils'

Component({
  properties: {
    type: {
      type: String
    },
    typeName: {
      type: String
    }
  },
  data: {
    nextTime: '',
    nextDate: '',
    nextSplit: 8,
  },
  observers: {
    'records' (_records) {
      const records = _records.slice()
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
  async attached () {
    this.storeBindings = createStoreBindings(this, {
      store,
      fields: {
        records: store => store[`${this.data.type}Records`]
      },
      actions: {
        setRecords: `set${this.data.type.charAt(0).toUpperCase() + this.data.type.slice(1)}Records`
      }
    })
    await this.fetchData()
  },
  methods: {
    async fetchData () {
      try {
        loading()
        const { result } = await wx.cloud.callFunction({
          name: 'remicade',
          data: {
            tableName: `records-${this.data.type}`
          }
        })
        this.setRecords(result || [])
      } catch (e) {
        error(e)
        toast(TOAST_ERRORS.NETWORK_ERR)
      } finally {
        loading(false)
      }
    },
    goEdit ({ currentTarget: { dataset: { id } } }) {
      wx.navigateTo({
        url: `/pages/modules/discover/pages/${this.data.type}/${this.data.type}-edit?id=${id}`
      })
    },
    goAdd () {
      wx.navigateTo({
        url: `/pages/modules/discover/pages/${this.data.type}/${this.data.type}-edit`
      })
    }
  }
})
