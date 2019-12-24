import { DateTime } from 'luxon'
import { DIARY_OPTION_LIST } from '../../../constants/index'

Page({
  data: {
    type: null,
    date: null,
    dateStr: ''
  },
  onLoad ({ diaryOptionIndex, ts }) {
    this.setData({
      type: DIARY_OPTION_LIST[Number(diaryOptionIndex)],
      date: DateTime.fromMillis(Number(ts))
    }, this.prepareViewData)
  },
  prepareViewData () {
    this.setData({
      dateStr: this.data.date.toLocaleString()
    })
  },
})
