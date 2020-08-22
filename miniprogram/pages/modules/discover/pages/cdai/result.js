import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import themeMixin from '../../../../../mixins/theme.mixin'
import shareMixin from '../../../../../mixins/share.mixin'

Component({
  behaviors: [storeBindingsBehavior, themeMixin, shareMixin],
  data: {
    score: 0,
    loaded: false,
    msg: '',
    type: ''
  },
  methods: {
    onLoad ({ score }) {
      const _score = Number(score)
      let _msg
      if (_score < 150) {
        _msg = '临床缓解'
      } else if (_score < 221) {
        _msg = '轻度至中度活动克罗恩病'
      } else if (_score < 451) {
        _msg = '中度至重度活动克罗恩病'
      } else {
        _msg = '重度活动性至爆发性克罗恩病'
      }
      this.setData({
        score: _score.toFixed(0),
        msg: _msg,
        type: _score >= 150 ? 'warn' : 'success',
        loaded: true
      })
    },
    back () {
      wx.navigateBack()
    },
    exit () {
      wx.navigateBack({ delta: 2 })
    }
  }
})