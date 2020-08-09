import { debug } from '../utils/log.utils'

module.exports = Behavior({
  methods: {
    onShareAppMessage () {
      debug('onShareAppMessage')
      return {
        title: 'IBD日记',
        path: '/pages/index/index'
      }
    }
  }
})
