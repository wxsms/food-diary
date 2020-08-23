import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import { loading, LOADING_TEXTS, toast, TOAST_ERRORS } from '../../utils/toast.utils'
import { debug, error } from '../../utils/log.utils'
import find from 'lodash.find'
import get from 'lodash.get'
import isEqual from 'lodash.isequal'
import isNumber from 'lodash.isnumber'
import isNil from 'lodash.isnil'
import { nextTick } from '../../utils/wx.utils'
import { store } from '../../store/store'
import { SCD_STATUS } from '../../constants/constants'

const options = [{
  text: SCD_STATUS.PENDING.text,
  value: SCD_STATUS.PENDING.value,
  desc: []
}, {
  text: SCD_STATUS.OK.text,
  value: SCD_STATUS.OK.value,
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
  text: SCD_STATUS.NOT_OK.text,
  value: SCD_STATUS.NOT_OK.value,
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
  text: SCD_STATUS.NOT_EAT.text,
  value: SCD_STATUS.NOT_EAT.value,
  desc: []
}]

Component({
  behaviors: [storeBindingsBehavior],
  data: {
    showDesc: false,
    descOption: options[0],
    descOptionsScrollTop: 0,
    options: options
  },
  storeBindings: {
    store,
    fields: {
      record: store => store.scdRecord,
      showUpdateActionSheet: store => store.showUpdateActionSheet,
      selectedScdFood: store => store.selectedScdFood
    },
    actions: {
      setScdRecord: 'setScdRecord',
      setShowUpdateActionSheet: 'setShowUpdateActionSheet',
      setSelectedScdFood: 'setSelectedScdFood'
    }
  },
  methods: {
    hideAction () {
      this.setShowUpdateActionSheet(false)
    },
    async onActionPress ({ detail: { value } }) {
      const selectedFoodId = get(this.data.selectedScdFood, '_id')
      const record = this.data.record
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
      loading(true, LOADING_TEXTS.RECORDING)
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
            this.hideAction()
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
            this.hideAction()
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
        const selectedFoodId = get(this.data.selectedScdFood, '_id')
        const record = this.data.record
        const desc = (get(record, `${selectedFoodId}.desc`) || []).slice()
        debug('desc from mobx', desc)
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
      const selectedFoodId = get(this.data.selectedScdFood, '_id')
      const record = this.data.record
      let recordOfFood = get(record, selectedFoodId)
      if (isNumber(recordOfFood)) {
        recordOfFood = {
          status: recordOfFood
        }
      }
      if (isEqual(this._descArr, get(recordOfFood, `desc`))) {
        this.hideDesc()
        return
      }
      const recordOfFoodNew = {
        ...recordOfFood,
        desc: this._descArr
      }
      try {
        loading(true, LOADING_TEXTS.RECORDING)
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
    }
  }
})
