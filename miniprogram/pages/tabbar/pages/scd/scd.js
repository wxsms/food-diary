import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import { loading, toast, TOAST_ERRORS } from '../../../../utils/toast.utils'
import themeMixin from '../../../../mixins/theme.mixin'
import shareMixin from '../../../../mixins/share.mixin'
import { getFoods, SCD_LEVEL } from '../../../../store/scd-foods.store'
import { debug, error } from '../../../../utils/log.utils'
import find from 'lodash.find'

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
    record: null,
    activeTab: 0,
    selectedFood: null,
    showActionSheet: false,
    options: [{
      text: '待定',
      value: -1
    }, {
      text: '耐受',
      value: 1
    }, {
      text: '不耐受',
      value: 2,
      type: 'warn'
    }, {
      text: '没吃过',
      value: 0
    }]
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
        this.setData({ record: data[0] })
      }
    },
    async showAction ({ currentTarget: { dataset: { id } } }) {
      const foods = await getFoods()
      const item = find(foods, v => v._id === id)
      if (!item) {
        return
      }
      // debug(item)
      this.setData({
        selectedFood: item,
        showActionSheet: true
      })
    },
    hideAction () {
      this.setData({
        showActionSheet: false
      })
    },
    async onActionPress ({ detail: { value } }) {
      // 0 为取消记录选项，如记录本身不存在，可以忽略
      if (value === 0 && (!this.data.record || typeof this.data.record[this.data.selectedFood._id] !== 'number')) {
        this.hideAction()
        return
      }
      // 记录存在且与选项一致，可以忽略
      if (this.data.record && this.data.record[this.data.selectedFood._id] === value) {
        this.hideAction()
        return
      }
      loading(true, '记录中...')
      try {
        const db = wx.cloud.database()
        if (this.data.record) {
          const newRecord = {
            ...this.data.record,
            [this.data.selectedFood._id]: value
          }
          delete newRecord._openid
          delete newRecord._id
          const { stats: { updated } } = await db
            .collection('records-scd')
            .doc(this.data.record._id)
            .update({
              data: newRecord
            })
          if (updated === 1) {
            this.setData({
              record: {
                ...this.data.record,
                ...newRecord
              }
            })
          } else {
            toast(TOAST_ERRORS.NETWORK_ERR)
          }
        } else {
          const newRecord = {
            [this.data.selectedFood._id]: value
          }
          const { _id } = await db
            .collection('records-scd')
            .add({
              data: newRecord
            })
          debug(_id)
          if (_id) {
            this.setData({
              record: {
                _id,
                ...newRecord
              }
            })
          } else {
            toast(TOAST_ERRORS.NETWORK_ERR)
          }
        }
        this.hideAction()
      } catch (e) {
        error(e)
        toast(TOAST_ERRORS.NETWORK_ERR)
      } finally {
        loading(false)
      }
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
