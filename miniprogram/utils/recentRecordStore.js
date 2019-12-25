import { uniq, chunk, reverse } from 'lodash'

const maxSize = 6

export function cacheInput (key, str) {
  const oldCache = getCache(key)
  const newCache = str.trim().split('\n').filter(v => !!v).map(v => v.trim())
  const cache = chunk(uniq([].concat(reverse(newCache), oldCache)), maxSize)[0]
  wx.setStorage({
    key: `cache_${key}`,
    data: cache
  })
}

export function getCache (key) {
  const cache = wx.getStorageSync(`cache_${key}`)
  return cache ? cache : []
}
