import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import computedBehavior from 'miniprogram-computed'
import themeMixin from '../../../../../mixins/theme.mixin'
import shareMixin from '../../../../../mixins/share.mixin'
import { debug } from '../../../../../utils/log.utils'
import { loading, toast, TOAST_ERRORS } from '../../../../../utils/toast.utils'
import { removeLevelInName } from '../../../../../store/scd-foods.store'
import { store } from '../../../../../store/store'
import isNil from 'lodash.isnil'
import find from 'lodash.find'
import get from 'lodash.get'
import isNumber from 'lodash.isnumber'
import { SCD_STATUS } from '../../../../../constants/constants'

Component({
  behaviors: [storeBindingsBehavior, computedBehavior, themeMixin, shareMixin],
  data: {
    foodData: null
  },
  storeBindings: {
    store,
    fields: {
      record: store => store.scdRecord
    },
    actions: {
      setScdRecord: 'setScdRecord'
    }
  },
  computed: {
    recordStatus ({ record, foodData }) {
      if (isNil(record) || isNil(foodData)) {
        return ''
      }
      let status = get(record, foodData._id)
      if (!isNumber(status)) {
        status = get(status, 'status')
      }
      return get(find(SCD_STATUS, v => v.value === status), 'text', SCD_STATUS.NOT_EAT.text)
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
    }
  }
})
