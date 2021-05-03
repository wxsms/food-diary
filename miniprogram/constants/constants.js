import { addWeek, format, FORMATS } from '../utils/date.utils'

const _DIARY_TYPES = {
  BREAKFAST: {
    label: '早餐',
    key: 'breakfast',
    r: true
  },
  LUNCH: {
    label: '午餐',
    key: 'lunch',
    r: true
  },
  DINNER: {
    label: '晚餐',
    key: 'dinner',
    r: true
  },
  SUPPLEMENT: {
    label: '补充',
    desc: '正餐以外的其它进食',
    key: 'supplement',
    r: true
  },
  OTHERS: {
    label: '其它',
    desc: '用药，或者任意想写的',
    key: 'others',
    r: false
  },
  ABNORMAL: {
    label: '异常',
    desc: '感到不舒服？',
    key: 'abnormal',
    r: false
  },
  WEIGHT: {
    label: '体重',
    key: 'weight',
    r: false
  },
  DEFECATION: {
    label: '排便次数',
    key: 'defecation',
    r: false
  },
  DEFECATION_REMARK: {
    label: '排便情况',
    key: 'defecationRemark',
    r: false
  }
}
_DIARY_TYPES.STATUS = {
  label: '状况',
  key: 'status',
  desc: '体重、排便次数',
  keys: [_DIARY_TYPES.WEIGHT.key, _DIARY_TYPES.DEFECATION.key, _DIARY_TYPES.DEFECATION_REMARK.key],
  r: true
}

export const DIARY_TYPES = _DIARY_TYPES
export const DIARY_OPTION_LIST = [
  DIARY_TYPES.BREAKFAST,
  DIARY_TYPES.LUNCH,
  DIARY_TYPES.DINNER,
  DIARY_TYPES.SUPPLEMENT,
  DIARY_TYPES.STATUS,
  DIARY_TYPES.OTHERS,
  DIARY_TYPES.ABNORMAL
]

export const STORAGE_KEYS = {
  SCD_FOODS_VERSION: 'SCD_FOODS_VERSION',
  SCD_FOODS: 'SCD_FOODS',
  USER_OPEN_ID: 'USER_OPEN_ID'
}

export const SCD_STATUS = {
  PENDING: {
    value: -1,
    text: '待定'
  },
  OK: {
    value: 1,
    text: '耐受'
  },
  NOT_OK: {
    value: 2,
    text: '不耐受'
  },
  NOT_EAT: {
    value: 0,
    text: '没吃过'
  }
}

const mab_0268 = (prev) => {
  const prevTime = prev.time
  const prevDate = prev.date
  let nextSplit = 8
  if (prevTime === 1) {
    nextSplit = 2
  } else if (prevTime === 2) {
    nextSplit = 4
  }
  const date = new Date(prevDate)
  const ts = date.getTime()
  const nextDate = format(addWeek(ts, nextSplit), FORMATS.Y_M_D)
  return {
    nextTime: prevTime + 1,
    nextDate,
    nextSplit
  }
}

export const MAB = {
  REMICADE: {
    id: 'remicade',
    name: '英夫利西单抗',
    productName: '类克',
    calcNextTime: mab_0268
  },
  VEDOLIZUMAB: {
    id: 'vedolizumab',
    name: '维得利珠单抗',
    productName: '安吉优',
    calcNextTime: mab_0268
  }
}
