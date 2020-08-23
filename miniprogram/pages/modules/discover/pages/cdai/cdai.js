import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import themeMixin from '../../../../../mixins/theme.mixin'
import shareMixin from '../../../../../mixins/share.mixin'
import { debug, error } from '../../../../../utils/log.utils'
import { loading, LOADING_TEXTS, toast, TOAST_ERRORS } from '../../../../../utils/toast.utils'
import { CDAI } from '../../constants/cdai'
import find from 'lodash.find'

function validateNumber (value, fieldName) {
  if (!/^\d*\.?\d*$/.test(value)) {
    return `${fieldName}请输入数字`
  }
  return undefined
}

Component({
  behaviors: [storeBindingsBehavior, themeMixin, shareMixin],
  data: {
    CDAI,
    showTopTips: false,
    formData: {},
    rules: [
      {
        name: 'sex',
        rules: { required: true, message: '请选择性别' }
      },
      {
        name: 'defecation',
        rules: [
          { required: true, message: '请输入排便情况' },
          { min: 0, message: '排便次数不能小于 0' },
          { validator: (rule, value) => validateNumber(value, '排便次数') }
        ],
      },
      {
        name: 'defecationMedication',
        rules: { required: false }
      },
      {
        name: 'stomachache',
        rules: { required: true, message: '请选择腹痛评分' }
      },
      {
        name: 'healthStatus',
        rules: { required: true, message: '请选择健康状况' }
      },
      {
        name: 'complication',
        rules: { required: false }
      },
      {
        name: 'lump',
        rules: { required: true, message: '请选择腹部肿块情况' }
      },
      {
        name: 'hct',
        rules: [
          { required: true, message: '请输入红细胞比容' },
          { range: [0, 100], message: '红细胞比容需要输入 0~100 的数字' },
          { validator: (rule, value) => validateNumber(value, '红细胞比容') }
        ],
      },
      {
        name: 'weight',
        rules: [
          { required: true, message: '请输入体重' },
          { min: 0, message: '体重小于 0' },
          { validator: (rule, value) => validateNumber(value, '体重') }
        ],
      },
      {
        name: 'height',
        rules: [
          { required: true, message: '请输入身高' },
          { min: 0, message: '身高不能小于 0' },
          { validator: (rule, value) => validateNumber(value, '身高') }
        ],
      }
    ]
  },
  methods: {
    formInputChange ({ detail: { value }, currentTarget: { dataset: { field } } }) {
      debug(field, value, typeof value)
      this.setData({
        [`formData.${field}`]: value
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
          loading(true, LOADING_TEXTS.CALCULATING)
          debug('ok')
          const _formData = {
            ...this.data.formData,
            defecation: Number(this.data.formData.defecation),
            hct: Number(this.data.formData.hct),
            weight: Number(this.data.formData.weight),
            height: Number(this.data.formData.height),
          }
          debug(_formData)
          const {
            sex,
            defecation,
            defecationMedication,
            stomachache,
            healthStatus,
            complication,
            lump,
            hct,
            weight,
            height
          } = _formData
          const isMale = sex === CDAI.SEX_MALE.value
          debug('isMale', isMale)
          let score = 0
          // 排便次数，每次 14 分
          score += 14 * defecation
          // 服药加分
          if (Array.isArray(defecationMedication)) {
            defecationMedication.forEach(v => {
              // debug(v, find(CDAI, _v => _v.value === v))
              score += find(CDAI, _v => _v.value === v).score
            })
          }
          // 腹痛分
          score += find(CDAI, _v => _v.value === stomachache).score
          // 状况分
          score += find(CDAI, _v => _v.value === healthStatus).score
          // 症状分
          if (Array.isArray(complication)) {
            complication.forEach(v => {
              // debug(v, find(CDAI, _v => _v.value === v))
              score += find(CDAI, _v => _v.value === v).score
            })
          }
          // 腹部肿块分
          score += find(CDAI, _v => _v.value === lump).score
          // HCT 分，绝对值每个百分比的偏差记 6 分
          const hctBase = isMale ? 47 : 42
          score += Math.abs(hctBase - hct) * 6
          // 体重分，低于标准体重时每个百分比的偏差记 1 分
          const weightBase = isMale ? ((height - 80) * 0.7) : ((height - 70) * 0.6)
          const weightOffset = (1 - weight / weightBase) * 100
          debug(weightBase, weightOffset)
          score += weightOffset > 0 ? weightOffset : 0
          debug('cdai', score)
          const db = wx.cloud.database()
          if (this._id) {
            await db
              .collection('records-cdai')
              .doc(this._id)
              .update({
                data: {
                  ..._formData,
                  updateTime: db.serverDate()
                }
              })
            loading(false)
            wx.navigateTo({
              url: `/pages/modules/discover/pages/cdai/result?score=${score}`
            })
          } else {
            const { _id } = await db
              .collection('records-cdai')
              .add({
                data: {
                  ..._formData,
                  createTime: db.serverDate(),
                  updateTime: db.serverDate()
                }
              })
            if (_id) {
              this._id = _id
              loading(false)
              wx.navigateTo({
                url: `/pages/modules/discover/pages/cdai/result?score=${score}`
              })
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