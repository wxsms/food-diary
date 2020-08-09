import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import { store } from '../../store/store'
import { debug } from '../../utils/log.utils'
import { DIARY_TYPES } from '../../constants/index'

Component({
  behaviors: [storeBindingsBehavior],
  storeBindings: {
    store,
    fields: {
      todayRecord: store => store.todayRecord,
      todayHasDefecation: store => store.todayHasDefecation,
      todayHasWeight: store => store.todayHasWeight
    }
  },
  properties: {
    type: null
  },
  data: {
    show: false,
    isOthers: false
  },
  observers: {
    'todayRecord, type' (todayRecord, type) {
      // debug('card observers', todayRecord, type)
      let show = false
      let isOthers = false
      if (type && todayRecord) {
        const { key } = type
        isOthers = key === DIARY_TYPES.OTHERS.key
        if (isOthers) {
          show = !!(this.data.todayHasWeight || this.data.todayHasDefecation || todayRecord[key])
        } else {
          show = !!(todayRecord[key])
        }
      }
      this.setData({ show, isOthers })
    }
  },
  methods: {
    goEdit () {
      this.triggerEvent('card-tap', this.data.type)
    }
  }
})
