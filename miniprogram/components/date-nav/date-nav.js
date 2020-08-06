import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import { store } from '../../store/store'
import { nextTick } from '../../utils/wx.utils'
import { addDay, minusDay } from '../../utils/date.utils'

Component({
  behaviors: [storeBindingsBehavior],
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
      setCurrentDate: 'setCurrentDate'
    }
  },
  methods: {
    async goPrevDay () {
      this.setCurrentDate(minusDay(this.data.currentDate))
      await nextTick()
      this.triggerEvent('change')
    },
    async goNextDay () {
      this.setCurrentDate(addDay(this.data.currentDate))
      await nextTick()
      this.triggerEvent('change')
    }
  }
})
