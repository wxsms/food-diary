import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import { store } from '../../store/store'
import { nextTick } from '../../utils/wx.utils'
import { addMonth, minusMonth } from '../../utils/date.utils'

Component({
  behaviors: [storeBindingsBehavior],
  storeBindings: {
    store,
    fields: {
      currentMonth: store => store.currentMonth,
      currentMonthStr: store => store.currentMonthStr,
      prevMonthStr: store => store.prevMonthStr,
      nextMonthStr: store => store.nextMonthStr
    },
    actions: {
      setCurrentMonth: 'setCurrentMonth'
    }
  },
  methods: {
    async goPrevMonth () {
      this.setCurrentMonth(minusMonth(this.data.currentMonth))
      await nextTick()
      this.triggerEvent('change')
    },
    async goNextMonth () {
      this.setCurrentMonth(addMonth(this.data.currentMonth))
      await nextTick()
      this.triggerEvent('change')
    }
  }
})
