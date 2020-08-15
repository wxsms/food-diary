import { debug } from './log.utils'

let IS_IOS

export function isIos () {
  if (typeof IS_IOS === 'boolean') {
    return IS_IOS
  }
  const platform = wx.getSystemInfoSync().platform
  debug('platform', platform)
  IS_IOS = platform === 'ios'
  debug('ios', IS_IOS)
  return IS_IOS
}
