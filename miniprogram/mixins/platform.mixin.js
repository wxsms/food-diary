import { isIos } from '../utils/system.utils'

module.exports = Behavior({
  data: {
    isIos: isIos()
  }
})
