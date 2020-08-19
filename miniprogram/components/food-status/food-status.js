import isNil from 'lodash.isnil'
import get from 'lodash.get'
import isNumber from 'lodash.isnumber'
import find from 'lodash.find'
import { SCD_STATUS } from '../../constants/constants'
import computedBehavior from 'miniprogram-computed'

Component({
  behaviors: [computedBehavior],
  properties: {
    record: null,
    showText: {
      type: Boolean,
      value: false
    }
  },
  data: {
    SCD_STATUS
  },
  computed: {
    recordStatus ({ record }) {
      if (isNil(record)) {
        return SCD_STATUS.NOT_EAT.value
      }
      let status = record
      if (!isNumber(status)) {
        status = get(status, 'status')
      }
      return status
    },
    recordStatusText ({ record }) {
      if (isNil(record)) {
        return SCD_STATUS.NOT_EAT.text
      }
      let status = record
      if (!isNumber(status)) {
        status = get(status, 'status')
      }
      return get(find(SCD_STATUS, v => v.value === status), 'text', SCD_STATUS.NOT_EAT.text)
    }
  }
})
