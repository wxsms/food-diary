import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import { loading, toast, TOAST_ERRORS } from '../../../../utils/toast.utils'
import themeMixin from '../../../../mixins/theme.mixin'
import shareMixin from '../../../../mixins/share.mixin'
import { getFoods, SCD_LEVEL } from '../../../../store/scd-foods.store'
import { debug, error } from '../../../../utils/log.utils'
import find from 'lodash.find'
import get from 'lodash.get'
import isEqual from 'lodash.isequal'
import isNumber from 'lodash.isnumber'
import isNil from 'lodash.isnil'
import { nextTick } from '../../../../utils/wx.utils'
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

const VALUE_DETAIL = -10
const options = [{
  text: '待定',
  value: -1,
  desc: []
}, {
  text: '耐受',
  value: 1,
  desc: [
    '需要煮熟',
    '需要放置成熟',
    '需要打糊',
    '需要去皮去籽',
    '需要充分发酵',
    '需要充分浸泡',
    '少量食用',
    '仅调味，不直接食用'
  ]
}, {
  text: '不耐受',
  value: 2,
  type: 'warn',
  desc: [
    '腹泻',
    '腹痛',
    '便血',
    '肠鸣',
    '肠梗阻',
    '发热',
    '其它反应'
  ]
}, {
  text: '没吃过',
  value: 0,
  desc: []
}, {
  text: '查看详情',
  value: VALUE_DETAIL,
  desc: []
}]

Component({
  behaviors: [storeBindingsBehavior, themeMixin, shareMixin],
  data: {
    foods: [],
    filtered: false,
    activeTab: 0,
    selectedFood: null,
    showActionSheet: false,
    showDesc: false,
    descOption: options[0],
    descOptionsScrollTop: 0,
    options: options
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
      const selectedFoodId = get(this.data.selectedFood, '_id')
      const record = this.data.record
      if (value === VALUE_DETAIL) {
        this.hideAction()
        wx.navigateTo({
          url: `/pages/modules/scd/pages/detail/detail?id=${selectedFoodId}`
        })
        return
      }
      let recordOfSelected = get(record, selectedFoodId)
      if (isNumber(recordOfSelected)) {
        recordOfSelected = {
          status: recordOfSelected
        }
      }
      if (value === 0 && isNil(recordOfSelected)) {
        // 0 为取消记录选项，如记录本身不存在，可以忽略
        this.hideAction()
        return
      }
      // 记录存在且与选项一致，可以忽略
      if (get(recordOfSelected, 'status') === value) {
        this.hideAction()
        await nextTick()
        this.showDescIfNeeded(value)
        return
      }
      loading(true, '记录中...')
      try {
        const db = wx.cloud.database()
        const _ = db.command
        if (record) {
          const { stats: { updated } } = await db
            .collection('records-scd')
            .doc(record._id)
            .update({
              data: {
                [selectedFoodId]: _.set({
                  status: value
                })
              }
            })
          if (updated === 1) {
            this.setData({
              showActionSheet: false
            })
            this.setScdRecord({
              ...record,
              [selectedFoodId]: {
                status: value
              }
            })
            await nextTick()
            this.showDescIfNeeded(value)
          } else {
            toast(TOAST_ERRORS.NETWORK_ERR)
          }
        } else {
          const { _id } = await db
            .collection('records-scd')
            .add({
              data: {
                [selectedFoodId]: {
                  status: value
                }
              }
            })
          debug(_id)
          if (_id) {
            this.setData({
              showActionSheet: false
            })
            this.setScdRecord({
              _id,
              [selectedFoodId]: {
                status: value
              }
            })
            await nextTick()
            this.showDescIfNeeded(value)
          } else {
            toast(TOAST_ERRORS.NETWORK_ERR)
          }
        }
      } catch (e) {
        error(e)
        toast(TOAST_ERRORS.NETWORK_ERR)
      } finally {
        loading(false)
      }
    },
    showDescIfNeeded (value) {
      const valueOption = find(this.data.options, v => v.value === value)
      const descArr = get(valueOption, 'desc')
      if (Array.isArray(descArr) && descArr.length) {
        const selectedFoodId = get(this.data.selectedFood, '_id')
        const record = this.data.record
        const desc = get(record, `${selectedFoodId}.desc`) || []
        this._descArr = desc
        this.setData({
          showDesc: true,
          descOptionsScrollTop: 0,
          descOption: {
            ...valueOption,
            desc: valueOption.desc.map(v => ({
              text: v,
              checked: desc.indexOf(v) >= 0
            }))
          }
        })
      }
    },
    onDescChange ({ detail: { value } }) {
      this._descArr = value
    },
    hideDesc () {
      this._descArr = []
      this.setData({ showDesc: false })
    },
    async saveDesc () {
      if (!Array.isArray(this._descArr)) {
        this._descArr = []
      }
      debug(this._descArr)
      const selectedFoodId = get(this.data.selectedFood, '_id')
      const record = this.data.record
      const recordOfFood = get(record, selectedFoodId)
      if (isEqual(this._descArr, get(recordOfFood, `desc`))) {
        this.hideDesc()
        return
      }
      const recordOfFoodNew = {
        ...recordOfFood,
        desc: this._descArr
      }
      try {
        loading(true, '记录中...')
        const db = wx.cloud.database()
        const _ = db.command
        await db
          .collection('records-scd')
          .doc(record._id)
          .update({
            data: {
              [selectedFoodId]: _.set(recordOfFoodNew)
            }
          })
        loading(false)
        this.setData({
          showDesc: false
        })
        this.setScdRecord({
          ...record,
          [selectedFoodId]: recordOfFoodNew
        })
      } catch (e) {
        error(e)
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
