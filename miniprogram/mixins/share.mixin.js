import { debug } from '../utils/log.utils'

module.exports = Behavior({
  methods: {
    onShareAppMessage () {
      let path
      try {
        path = getCurrentPages()[0].route
      } catch (e) {
        debug(e)
        path = 'pages/tabbar/pages/index/index'
      }
      debug('onShareAppMessage', path)
      return {
        title: 'IBD日记',
        path
      }
    }
  }
})
