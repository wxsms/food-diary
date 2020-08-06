import { DateTime } from 'luxon'
import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import { store } from '../../store/store'
import { nextTick } from '../../utils/wx.utils'

Component({
  behaviors: [storeBindingsBehavior],
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
    async goPrevDay () {
      this.setCurrentDateTs(DateTime.fromMillis(this.data.currentDateTs).minus({ days: 1 }).ts)
      await nextTick()
      this.triggerEvent('change')
    },
    async goNextDay () {
      this.setCurrentDateTs(DateTime.fromMillis(this.data.currentDateTs).plus({ days: 1 }).ts)
      await nextTick()
      this.triggerEvent('change')
    }
  }
})
