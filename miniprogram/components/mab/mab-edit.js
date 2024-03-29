import { createStoreBindings } from 'mobx-miniprogram-bindings'
import { debug, error } from '../../utils/log.utils'
import { loading, LOADING_TEXTS, toast, TOAST_ERRORS } from '../../utils/toast.utils'
import isString from 'lodash.isstring'
import { format, FORMATS } from '../../utils/date.utils'
import { store } from '../../store/store'
import find from 'lodash.find'
import findIndex from 'lodash.findindex'
import { nextTick } from '../../utils/wx.utils'

function validateNumber (value, fieldName) {
  if (isString(value) && value.length > 0 && !/^\d*\.?\d*$/.test(value)) {
    return `${fieldName}请输入数字`
  }
  return undefined
}

Component({
  properties: {
    type: {
      type: Object
    },
    recordId: {
      type: String
    }
  },
  data: {
    showTopTips: false,
    formData: {
      date: format(Date.now(), FORMATS.Y_MM_DD_SIMPLE)
    },
    rules: [
      {
        name: 'date',
        rules: { required: true, message: '请选择时间' }
      },
      {
        name: 'time',
        rules: [
          { required: true, message: '请输入注射次数' },
          { min: 1, message: '注射次数不能小于 1' },
          { validator: (rule, value) => validateNumber(value, '注射次数') }
        ],
      },
      {
        name: 'dosage',
        rules: [
          { required: true, message: '请输入注射剂量' },
          { min: 0, message: '注射剂量不能小于 0' },
          { validator: (rule, value) => validateNumber(value, '注射剂量') }
        ],
      },
      {
        name: 'concentration',
        rules: [
          { min: 0, message: '类克浓度不能小于 0' },
          { validator: (rule, value) => validateNumber(value, '类克浓度') }
        ],
      },
      {
        name: 'antibody',
        rules: [
          { min: 0, message: '类克抗体不能小于 0' },
          { validator: (rule, value) => validateNumber(value, '类克抗体') }
        ],
      }
    ]
  },
  async attached () {
    this.storeBindings = createStoreBindings(this, {
      store,
      fields: {
        records: store => store[`${this.data.type.id}Records`]
      },
      actions: {
        setRecords: `set${this.data.type.id.charAt(0).toUpperCase() + this.data.type.id.slice(1)}Records`
      }
    })
    await nextTick()
    const records = this.data.records.slice()
    // console.log('recordId:', this.data.recordId)
    if (this.data.recordId) {
      const data = find(records, v => v._id === this.data.recordId)
      this.setData({
        formData: {
          date: data.date,
          nextDate: data.nextDate,
          time: data.time.toString(),
          dosage: data.dosage.toString(),
          concentration: data.concentration ? data.concentration.toString() : '',
          antibody: data.antibody ? data.antibody.toString() : ''
        }
      })
    } else if (records.length > 0) {
      const lastRecord = records[0]
      debug(lastRecord)
      this.setData({
        formData: {
          ...this.data.formData,
          time: lastRecord.time + 1,
          dosage: lastRecord.dosage
        }
      })
    }
  },
  methods: {
    onDateChange ({ detail: { value } }) {
      this.setData({
        formData: {
          ...this.data.formData,
          date: value
        }
      })
    },
    onNextDateChange ({ detail: { value } }) {
      this.setData({
        formData: {
          ...this.data.formData,
          nextDate: value
        }
      })
    },
    formInputChange ({ detail: { value }, currentTarget: { dataset: { field } } }) {
      debug(field, value, typeof value)
      this.setData({
        [`formData.${field}`]: value
      })
    },
    deleteRecord () {
      wx.showModal({
        title: '确认',
        content: '记录删除后将无法恢复',
        confirmText: '删除',
        confirmColor: '#fa5151',
        cancelText: '取消',
        success: async ({ confirm }) => {
          if (confirm) {
            loading(true, LOADING_TEXTS.DELETING)
            const db = wx.cloud.database()
            try {
              const { stats: { removed } } = await db
                .collection(`records-${this.data.type.id}`)
                .doc(this.data.recordId)
                .remove()
              if (removed) {
                const oldData = this.data.records.slice()
                const index = findIndex(oldData, v => v._id === this.data.recordId)
                oldData.splice(index, 1)
                this.setRecords([].concat(oldData))
                wx.navigateBack()
              } else {
                toast(TOAST_ERRORS.NETWORK_ERR)
              }
            } catch (e) {
              error(e)
              toast(TOAST_ERRORS.NETWORK_ERR)
            } finally {
              loading(false)
            }
          }
        }
      })
    },
    submitForm () {
      this.selectComponent('#form').validate(async (valid, errors) => {
        debug('valid', valid, errors)
        if (!valid && errors && errors.length) {
          debug('not ok')
          this.setData({
            error: errors.map(v => v.message).join('\r\n')
          })
          return
        }
        try {
          loading(true, LOADING_TEXTS.SAVING)
          debug('ok')
          const _formData = {
            ...this.data.formData,
            time: Number(this.data.formData.time),
            dosage: Number(this.data.formData.dosage),
            concentration: this.data.formData.concentration ? Number(this.data.formData.concentration) : '',
            antibody: this.data.formData.antibody ? Number(this.data.formData.antibody) : '',
          }
          debug(_formData)
          const db = wx.cloud.database()
          if (this.data.recordId) {
            await db
              .collection(`records-${this.data.type.id}`)
              .doc(this.data.recordId)
              .update({
                data: {
                  ..._formData,
                  updateTime: db.serverDate()
                }
              })
            loading(false)
            const oldData = this.data.records.slice()
            const index = findIndex(oldData, v => v._id === this.data.recordId)
            oldData[index] = { ...oldData[index], ..._formData }
            this.setRecords([].concat(oldData))
            wx.navigateBack()
          } else {
            const { _id } = await db
              .collection(`records-${this.data.type.id}`)
              .add({
                data: {
                  ..._formData,
                  createTime: db.serverDate(),
                  updateTime: db.serverDate()
                }
              })
            if (_id) {
              loading(false)
              const oldData = this.data.records.slice()
              oldData.unshift({
                _id,
                ..._formData
              })
              this.setRecords([].concat(oldData))
              wx.navigateBack()
            } else {
              loading(false)
              toast(TOAST_ERRORS.NETWORK_ERR)
            }
          }
        } catch (e) {
          error(e)
          loading(false)
          toast(TOAST_ERRORS.NETWORK_ERR)
        }
      })
    }
  }
})
