import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { loading, toast, TOAST_ERRORS } from '../../utils/toast.utils'
import { error } from '../../utils/log.utils'
import { store } from '../../store/store'
import { diffWeeks, format, FORMATS } from '../../utils/date.utils'

Component({
  properties: {
    type: {
      type: Object
    },
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
        const latest = records[0]
        const { nextTime, nextDate, nextSplit } = this.data.type.calcNextTime(latest)
        if (latest.nextDate) {
          const nextDate = new Date(latest.nextDate).getTime()
          const latestDate = new Date(latest.date).getTime()
          this.setData({
            nextTime,
            nextDate: format(nextDate, FORMATS.Y_M_D),
            nextSplit: diffWeeks(nextDate, latestDate)
          })
        } else {
          this.setData({
            nextTime,
            nextDate,
            nextSplit
          })
        }
      }
    }
  },
  async attached () {
    this.storeBindings = createStoreBindings(this, {
      store,
      fields: {
        records: store => store[`${this.data.type.id}Records`]
      },
      actions: {
        setRecords: `set${this.data.type.id.charAt(0).toUpperCase() + this.data.type.id.slice(1)}Records`
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
            tableName: `records-${this.data.type.id}`
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
        url: `/pages/modules/discover/pages/${this.data.type.id}/${this.data.type.id}-edit?id=${id}`
      })
    },
    goAdd () {
      wx.navigateTo({
        url: `/pages/modules/discover/pages/${this.data.type.id}/${this.data.type.id}-edit`
      })
    },
    async showDetail () {
      await wx.showModal({
        showCancel: false,
        title: `${this.data.type.name}（${this.data.type.productName}）`,
        content: this.data.type.desc
      })
    }
  }
})
