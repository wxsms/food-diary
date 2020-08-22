import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import themeMixin from '../../../../../mixins/theme.mixin'
import shareMixin from '../../../../../mixins/share.mixin'
import { debug } from '../../../../../utils/log.utils'
import { toast } from '../../../../../utils/toast.utils'

function validateNumber (value, fieldName) {
  if (!/^\d*\.?\d*$/.test(value)) {
    return `${fieldName}请输入数字`
  }
  return undefined
}

Component({
  behaviors: [storeBindingsBehavior, themeMixin, shareMixin],
  data: {
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
      this.selectComponent('#form').validate((valid, errors) => {
        console.log('valid', valid, errors)
        if (!valid && errors && errors.length) {
          debug('not ok')
          this.setData({
            error: errors.map(v => v.message).join('\r\n')
          })
        } else {
          debug('ok')
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
          } = this.data.formData
          const isMale = sex === 'male'
          let score = 0
          // 排便次数，每次 14 分
          score += 14 * Number(defecation)
          // 服药加分
          if (Array.isArray(defecationMedication)) {
            defecationMedication.forEach(v => {
              score += Number(v)
            })
          }
          // 腹痛分
          score += Number(stomachache)
          // 状况分
          score += Number(healthStatus)
          // 症状分
          if (Array.isArray(complication)) {
            complication.forEach(v => {
              score += Number(v)
            })
          }
          // 腹部肿块分
          score += Number(lump)
          // HCT 分，绝对值每个百分比的偏差记 6 分
          const hctBase = isMale ? 47 : 42
          score += Math.abs(hctBase - Number(hct)) * 6
          // 体重分，低于标准体重时每个百分比的偏差记 1 分
          const weightBase = isMale ? ((height - 80) * 0.7) : ((height - 70) * 0.6)
          const weightOffset = (1 - weight / weightBase) * 100
          debug(weightBase, weightOffset)
          score += weightOffset > 0 ? weightOffset : 0
          debug('cdai', score)
          wx.navigateTo({
            url: `/pages/modules/discover/pages/cdai/result?score=${score}`
          })
        }
      })
    }
  }
})