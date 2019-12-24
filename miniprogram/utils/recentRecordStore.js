import { uniq, chunk, reverse } from 'lodash'
import { DIARY_TYPES } from '../constants/index'

const maxSize = 6
const validKeys = {
  [DIARY_TYPES.BREAKFAST.key]: true,
  [DIARY_TYPES.LUNCH.key]: true,
  [DIARY_TYPES.DINNER.key]: true
}

export function cacheInput (key, str) {
  if (!validKeys[key]) {
    return
  }
  const oldCache = getCache(key)
  const newCache = str.trim().split('\n').filter(v => !!v)
  const cache = chunk(uniq([].concat(reverse(newCache), oldCache)), maxSize)[0]
  wx.setStorage({
    key: `cache_${key}`,
    data: cache
  })
}

export function getCache (key) {
  if (validKeys[key]) {
    const cache = wx.getStorageSync(`cache_${key}`)
    return cache ? cache : []
  } else {
    return []
  }
}
