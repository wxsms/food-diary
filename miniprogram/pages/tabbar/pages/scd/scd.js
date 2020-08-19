import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import { loading, toast, TOAST_ERRORS } from '../../../../utils/toast.utils'
import themeMixin from '../../../../mixins/theme.mixin'
import shareMixin from '../../../../mixins/share.mixin'
import { getFoods, SCD_LEVEL } from '../../../../store/scd-foods.store'
import { debug, error } from '../../../../utils/log.utils'
import find from 'lodash.find'
import { store } from '../../../../store/store'

function initFoods () {
  debug('initFoods')
  return [
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
}

Component({
  behaviors: [storeBindingsBehavior, themeMixin, shareMixin],
  data: {
    foods: [],
    filtered: false,
    activeTab: 0
  },
  storeBindings: {
    store,
    fields: {
      record: store => store.scdRecord,
      selectedScdFood: store => store.selectedScdFood
    },
    actions: {
      setScdRecord: 'setScdRecord',
      setShowUpdateActionSheet: 'setShowUpdateActionSheet',
      setSelectedScdFood: 'setSelectedScdFood'
    }
  },
  methods: {
    async onLoad () {
      try {
        loading()
        await getFoods()
        this.setData({
          onSearch: this.onSearch.bind(this),
          foods: initFoods()
        })
        await this.fetchMyRecord()
      } catch (e) {
        error(e)
        toast(TOAST_ERRORS.NETWORK_ERR)
      } finally {
        loading(false)
      }
    },
    async fetchMyRecord () {
      const db = wx.cloud.database()
      const { data } = await db.collection('records-scd').get()
      debug('my scd:', data)
      if (data && data.length) {
        this.setScdRecord(data[0])
      }
    },
    goDetail ({ currentTarget: { dataset: { id } } }) {
      wx.navigateTo({
        url: `/pages/modules/scd/pages/detail/detail?id=${id}`
      })
    },
    async showAction ({ currentTarget: { dataset: { id } } }) {
      const foods = await getFoods()
      const item = find(foods, v => v._id === id)
      if (!item) {
        return
      }
      this.setSelectedScdFood(item)
      this.setShowUpdateActionSheet(true)
    },
    async onSearch (value) {
      debug('search', value)
      await this.filterDisplay(value ? value.trim() : '')
      return Promise.resolve([])
    },
    async onSearchClear () {
      debug('search clear')
      await this.filterDisplay()
    },
    async filterDisplay (query) {
      const foods = await getFoods()
      let _foods
      if (typeof query === 'string' && query.length) {
        _foods = [{
          title: '搜索结果',
          list: foods.filter(v => v.name.indexOf(query) >= 0 || v.py_name.indexOf(query.toLowerCase()) >= 0)
        }]
      } else {
        _foods = initFoods()
      }
      // debug(_foods)
      this.setData({
        filtered: !!query,
        foods: _foods
      })
    }
  }
})
