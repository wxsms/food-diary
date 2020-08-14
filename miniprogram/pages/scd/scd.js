import { DIARY_OPTION_LIST, DIARY_TYPES } from '../../constants/index'
import { isReview, version } from '../../utils/version.utils'
import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import { store } from '../../store/store'
import { nextTick } from '../../utils/wx.utils'
import { debug, error } from '../../utils/log.utils'
import { loading, toast, TOAST_ERRORS } from '../../utils/toast.utils'
import themeMixin from '../../mixins/theme.mixin'
import shareMixin from '../../mixins/share.mixin'
import { getFoods, SCD_LEVEL } from '../../store/scd-foods.store'

Component({
  behaviors: [storeBindingsBehavior, themeMixin, shareMixin],
  data: {
    foods: [],
    activeTab: 0,
  },
  methods: {
    async onLoad () {
      await getFoods()
      this.setData({
        foods: [
          SCD_LEVEL.LV_0,
          SCD_LEVEL.LV_1,
          SCD_LEVEL.LV_2,
          SCD_LEVEL.LV_3,
          SCD_LEVEL.LV_4,
          SCD_LEVEL.LV_5
        ].map(v => ({
          ...v,
          title: v.name
        }))
      })
    },
    onTabCLick (e) {
      const index = e.detail.index
      console.log('tabClick', index)
    },
    onChange (e) {
      const index = e.detail.index
      console.log('change', index)
    }
  }
})
