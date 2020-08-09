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
    isStatus: false
  },
  observers: {
    'todayRecord, type' (todayRecord, type) {
      // debug('card observers', todayRecord, type)
      let show = false
      let isStatus = false
      if (type && todayRecord) {
        const { key } = type
        isStatus = key === DIARY_TYPES.STATUS.key
        if (isStatus) {
          show = !!(this.data.todayHasWeight || this.data.todayHasDefecation || todayRecord[key])
        } else {
          show = !!(todayRecord[key])
        }
      }
      this.setData({ show, isStatus })
    }
  },
  methods: {
    goEdit () {
      this.triggerEvent('card-tap', this.data.type)
    }
  }
})
