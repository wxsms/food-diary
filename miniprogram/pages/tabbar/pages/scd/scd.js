import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import { loading, toast, TOAST_ERRORS } from '../../../../utils/toast.utils'
import themeMixin from '../../../../mixins/theme.mixin'
import shareMixin from '../../../../mixins/share.mixin'
import { getFoods, SCD_LEVEL } from '../../../../store/scd-foods.store'
import { debug, error } from '../../../../utils/log.utils'
import find from 'lodash.find'
import get from 'lodash.get'
import { nextTick } from '../../../../utils/wx.utils'

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
    showDesc: false,
    descOption: null,
    options: [{
      text: '待定',
      value: -1
    }, {
      text: '耐受',
      value: 1,
      desc: [
        '需要煮熟',
        '需要打糊',
        '仅调味'
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
        '其它过敏反应'
      ]
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
              },
              showActionSheet: false
            })
            await nextTick()
            this.showDescIfNeeded(value)
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
              },
              showActionSheet: false
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
        this.setData({
          showDesc: true,
          descOption: {
            ...valueOption,
            desc: valueOption.desc.map(v => {
              return {
                text: v,
                checked: get(this.data.record, `${this.data.selectedFood._id}.desc`, []).indexOf(v) >= 0
              }
            })
          }
        })
      }
    },
    onDescChange ({ detail: { value } }) {
      this._descArr = value
    },
    hideDesc () {
      this._descArr = null
      this.setData({ showDesc: false })
    },
    async saveDesc () {
      debug(this._descArr)
      try {
        loading(true, '记录中...')
        const db = wx.cloud.database()
        const { stats: { updated } } = await db
          .collection('records-scd')
          .doc(this.data.record._id)
          .update({
            data: {
              [`desc.${this.data.selectedFood._id}`]: this._descArr
            }
          })
        if (updated === 1) {
          loading(false)
          this.setData({
            record: {
              ...this.data.record,
              desc: {
                ...this.data.record.desc,
                [this.data.selectedFood._id]: this._descArr
              }
            },
            showDesc: false
          })
        } else {
          toast(TOAST_ERRORS.NETWORK_ERR)
        }
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
