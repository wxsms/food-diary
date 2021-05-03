import { isIos } from '../utils/system.utils'

export default Behavior({
  data: {
    isIos: isIos()
  }
})
