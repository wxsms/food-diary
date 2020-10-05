import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import themeMixin from '../../../../../mixins/theme.mixin'
import shareMixin from '../../../../../mixins/share.mixin'
import { debug, error } from '../../../../../utils/log.utils'
import { loading, LOADING_TEXTS, toast, TOAST_ERRORS } from '../../../../../utils/toast.utils'
import isString from 'lodash.isstring'
import { format, FORMATS } from '../../../../../utils/date.utils'
import { store } from '../../../../../store/store'
import find from 'lodash.find'
import findIndex from 'lodash.findindex'
import { nextTick } from '../../../../../utils/wx.utils'

function validateNumber (value, fieldName) {
  if (isString(value) && value.length > 0 && !/^\d*\.?\d*$/.test(value)) {
    return `${fieldName}请输入数字`
  }
  return undefined
}

Component({
  behaviors: [storeBindingsBehavior, themeMixin, shareMixin],
  storeBindings: {
    store,
    fields: {
      remicadeRecords: store => store.remicadeRecords
    },
    actions: {
      setRemicadeRecords: 'setRemicadeRecords'
    }
  },
  data: {
    id: '',
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
          { min: 100, message: '注射剂量不能小于 100' },
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
  methods: {
    async onLoad ({ id }) {
      await nextTick()
      const records = this.data.remicadeRecords.slice()
      if (id) {
        const data = find(records, v => v._id === id)
        this.setData({
          id,
          formData: {
            date: data.date,
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
    onDateChange ({ detail: { value } }) {
      this.setData({
        formData: {
          ...this.data.formData,
          date: value
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
                .collection('records-remicade')
                .doc(this.data.id)
                .remove()
              if (removed) {
                const oldData = this.data.remicadeRecords.slice()
                const index = findIndex(oldData, v => v._id === this.data.id)
                oldData.splice(index, 1)
                this.setRemicadeRecords([].concat(oldData))
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
          if (this.data.id) {
            await db
              .collection('records-remicade')
              .doc(this.data.id)
              .update({
                data: {
                  ..._formData,
                  updateTime: db.serverDate()
                }
              })
            loading(false)
            const oldData = this.data.remicadeRecords.slice()
            const index = findIndex(oldData, v => v._id === this.data.id)
            oldData[index] = { ...oldData[index], ..._formData }
            this.setRemicadeRecords([].concat(oldData))
            wx.navigateBack()
          } else {
            const { _id } = await db
              .collection('records-remicade')
              .add({
                data: {
                  ..._formData,
                  createTime: db.serverDate(),
                  updateTime: db.serverDate()
                }
              })
            if (_id) {
              loading(false)
              const oldData = this.data.remicadeRecords.slice()
              oldData.unshift({
                _id,
                ..._formData
              })
              this.setRemicadeRecords([].concat(oldData))
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
