import find from 'lodash.find'
import { debug, error } from '../utils/log.utils'
import { STORAGE_KEYS } from '../constants/constants'
import { getScdVersion, isScdUpdated } from '../utils/version.utils'

export const SCD_LEVEL = {
  ALL: {
    name: '全部',
    list: []
  },
  LV_0: {
    name: '基础阶段',
    list: []
  },
  LV_1: {
    name: '第一阶段',
    list: []
  },
  LV_2: {
    name: '第二阶段',
    list: []
  },
  LV_3: {
    name: '第三阶段',
    list: []
  },
  LV_4: {
    name: '第四阶段',
    list: []
  },
  LV_5: {
    name: '第五阶段',
    list: []
  }
}

function removeLevelInName (v) {
  return {
    ...v,
    name: v.name.replace(/[（|(]?[第|基].+[)|）]?$/, '')
  }
}

export function setFoods (list) {
  debug('setFoods', list.length)
  SCD_LEVEL.LV_0.list = list
    .filter(v => v.name.indexOf(SCD_LEVEL.LV_0.name) >= 0)
    .map(removeLevelInName)
  SCD_LEVEL.LV_1.list = list
    .filter(v => v.name.indexOf(SCD_LEVEL.LV_1.name) >= 0 && !find(SCD_LEVEL.LV_0.list, _v => _v._id === v._id))
    .map(removeLevelInName)
  SCD_LEVEL.LV_2.list = list
    .filter(v => v.name.indexOf(SCD_LEVEL.LV_2.name) >= 0 && !find(SCD_LEVEL.LV_1.list, _v => _v._id === v._id))
    .map(removeLevelInName)
  SCD_LEVEL.LV_3.list = list
    .filter(v => v.name.indexOf(SCD_LEVEL.LV_3.name) >= 0 && !find(SCD_LEVEL.LV_2.list, _v => _v._id === v._id))
    .map(removeLevelInName)
  SCD_LEVEL.LV_4.list = list
    .filter(v => v.name.indexOf(SCD_LEVEL.LV_4.name) >= 0 && !find(SCD_LEVEL.LV_3.list, _v => _v._id === v._id))
    .map(removeLevelInName)
  SCD_LEVEL.LV_5.list = list
    .filter(v => v.name.indexOf(SCD_LEVEL.LV_5.name) >= 0 && !find(SCD_LEVEL.LV_4.list, _v => _v._id === v._id))
    .map(removeLevelInName)
  SCD_LEVEL.ALL.list = list
}

export async function getFoods () {
  debug('getFoods')
  if (SCD_LEVEL.ALL.list.length) {
    // 内存记录
    debug('foods existed')
    return SCD_LEVEL.ALL.list
  }
  try {
    // storage 记录
    const cacheUpdated = await isScdUpdated()
    if (cacheUpdated) {
      // 缓存版本是最新的，可以直接使用
      const { data } = await wx.getStorage({ key: STORAGE_KEYS.SCD_FOODS })
      if (Array.isArray(data) && data.length) {
        // 缓存存在，设置到内存并返回
        // 否则继续网络获取
        debug('foods cache existed')
        setFoods(data)
        return data
      }
    }
  } catch (e) {
    error(e)
  }
  // db 记录
  debug('fetching foods')
  try {
    const { result: { data } } = await wx.cloud.callFunction({ name: 'scd-foods' })
    const list = data || []
    setFoods(list)
    const version = await getScdVersion()
    // 设置缓存数据与版本
    await Promise.all([
      wx.setStorage({ key: STORAGE_KEYS.SCD_FOODS, data: list }),
      wx.setStorage({ key: STORAGE_KEYS.SCD_FOODS_VERSION, data: version })
    ])
    return list
  } catch (e) {
    error(e)
    return []
  }
}
