export const DIARY_TYPES = {
  BREAKFAST: { label: '早餐', key: 'breakfast', reviewOnly: true },
  LUNCH: { label: '午餐', key: 'lunch', reviewOnly: true },
  DINNER: { label: '晚餐', key: 'dinner', reviewOnly: true },
  SUPPLEMENT: { label: '补充', key: 'supplement', reviewOnly: true },
  OTHERS: { label: '其它', key: 'others', reviewOnly: false },
  ABNORMAL: { label: '异常', key: 'abnormal', reviewOnly: false }
}

export const DIARY_OPTION_LIST = [
  DIARY_TYPES.BREAKFAST,
  DIARY_TYPES.LUNCH,
  DIARY_TYPES.DINNER,
  DIARY_TYPES.SUPPLEMENT,
  DIARY_TYPES.OTHERS,
  DIARY_TYPES.ABNORMAL
]
