import { debug, error } from './log.utils'
import { toast, TOAST_ERRORS } from './toast.utils'
import { STORAGE_KEYS } from '../constants/constants'

let _openid = null

async function loginFromCache () {
  try {
    const { data } = await wx.getStorage({ key: STORAGE_KEYS.USER_OPEN_ID })
    if (typeof data === 'string' && data.length) {
      debug('[login] openId 缓存', data)
      _openid = data
      return true
    } else {
      return false
    }
  } catch (e) {
    error('[login] openId 缓存不存在', e)
    return false
  }
}

export async function login () {
  try {
    if (await loginFromCache()) {
      return
    }
    const { result: { openid } } = await wx.cloud.callFunction({ name: 'login' })
    debug('[login] user openid: ', openid)
    _openid = openid
    await wx.setStorage({ key: STORAGE_KEYS.USER_OPEN_ID, data: openid })
  } catch (err) {
    toast(TOAST_ERRORS.NETWORK_ERR)
    error('[login] 调用失败', err)
  }
}

export async function getOpenId () {
  if (typeof _openid === 'string') {
    return _openid
  } else {
    await login()
    return _openid
  }
}
