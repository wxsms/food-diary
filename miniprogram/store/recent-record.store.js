import uniq from 'lodash.uniq'
import reverse from 'lodash.reverse'
import chunk from 'lodash.chunk'
import { error } from '../utils/log.utils'

export const maxSize = 10

export function cacheInput (key, str) {
  const oldCache = getCache(key)
  const newCache = str.trim().split(/[\n,，、+]/g).filter(v => !!v).map(v => v.trim())
  const cache = chunk(uniq([].concat(reverse(newCache), oldCache)), maxSize)[0]
  wx.setStorage({
    key: `cache_${key}`,
    data: cache
  })
}

export function cacheDelete (key, str) {
  const cache = getCache(key)
  const index = cache.indexOf(str)
  if (index >= 0) {
    cache.splice(index, 1)
    wx.setStorage({
      key: `cache_${key}`,
      data: cache
    })
  }
  return cache
}

export function getCache (key) {
  try {
    const cache = wx.getStorageSync(`cache_${key}`)
    return cache ? cache : []
  } catch (e) {
    error(e)
    return []
  }
}
