import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import themeMixin from '../../../../../mixins/theme.mixin'
import shareMixin from '../../../../../mixins/share.mixin'
import { debug } from '../../../../../utils/log.utils'
import { loading, toast, TOAST_ERRORS } from '../../../../../utils/toast.utils'
import { getFoods, removeLevelInName } from '../../../../../store/scd-foods.store'
import { store } from '../../../../../store/store'
import find from 'lodash.find'

Component({
  behaviors: [storeBindingsBehavior, themeMixin, shareMixin],
  data: {
    foodData: null
  },
  storeBindings: {
    store,
    fields: {
      record: store => store.scdRecord
    },
    actions: {
      setScdRecord: 'setScdRecord',
      setShowUpdateActionSheet: 'setShowUpdateActionSheet',
      setSelectedScdFood: 'setSelectedScdFood'
    }
  },
  methods: {
    async onLoad ({ id }) {
      try {
        loading()
        const db = wx.cloud.database()
        const { data } = await db
          .collection('scd-foods')
          .doc(id)
          .get()
        const _data = removeLevelInName(data)
        // debug(_data.content)
        _data.content = _data.content.replace(/<img([^>]+src=".+".+?>)/ig, `<img class="rich-text-img" $1`)
        // debug(content)
        debug(_data)
        wx.setNavigationBarTitle({
          title: _data.name
        })
        this.setData({
          foodData: _data
        })
        loading(false)
      } catch (e) {
        debug(e)
        loading(false)
        toast(TOAST_ERRORS.NETWORK_ERR)
      }
    },
    async showAction () {
      const foods = await getFoods()
      const item = find(foods, v => v._id === this.data.foodData._id)
      if (!item) {
        return
      }
      this.setSelectedScdFood(item)
      this.setShowUpdateActionSheet(true)
    }
  }
})
