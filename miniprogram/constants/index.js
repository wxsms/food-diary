export const DIARY_TYPES = {
  BREAKFAST: { label: '早餐', key: 'breakfast', inReviewMode: true },
  LUNCH: { label: '午餐', key: 'lunch', inReviewMode: true },
  DINNER: { label: '晚餐', key: 'dinner', inReviewMode: true },
  SUPPLEMENT: { label: '补充', key: 'supplement', inReviewMode: true },
  OTHERS: { label: '其它', key: 'others', inReviewMode: false },
  ABNORMAL: { label: '异常', key: 'abnormal', inReviewMode: false },
  WEIGHT: { label: '体重', key: 'weight', inReviewMode: false },
  DEFECATION: { label: '排便次数', key: 'defecation', inReviewMode: false }
}

export const DIARY_OPTION_LIST = [
  DIARY_TYPES.BREAKFAST,
  DIARY_TYPES.LUNCH,
  DIARY_TYPES.DINNER,
  DIARY_TYPES.SUPPLEMENT,
  DIARY_TYPES.OTHERS,
  DIARY_TYPES.ABNORMAL
]
