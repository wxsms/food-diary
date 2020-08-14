import find from 'lodash.find'
import { debug, error } from '../utils/log.utils'

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

export async function getFoods () {
  if (SCD_LEVEL.ALL.list.length) {
    return SCD_LEVEL.ALL.list
  }
  try {
    const { result: { data } } = await wx.cloud.callFunction({ name: 'scd-foods' })
    const list = data || []
    SCD_LEVEL.LV_0.list = list
      .filter(v => v.name.indexOf(SCD_LEVEL.LV_0.name) >= 0)
      .map(removeLevelInName)
    SCD_LEVEL.LV_1.list = list
      .filter(v => v.name.indexOf(SCD_LEVEL.LV_1.name) >= 0 && !find(SCD_LEVEL.LV_0.list, _v => _v.id === v.id))
      .map(removeLevelInName)
    SCD_LEVEL.LV_2.list = list
      .filter(v => v.name.indexOf(SCD_LEVEL.LV_2.name) >= 0 && !find(SCD_LEVEL.LV_1.list, _v => _v.id === v.id))
      .map(removeLevelInName)
    SCD_LEVEL.LV_3.list = list
      .filter(v => v.name.indexOf(SCD_LEVEL.LV_3.name) >= 0 && !find(SCD_LEVEL.LV_2.list, _v => _v.id === v.id))
      .map(removeLevelInName)
    SCD_LEVEL.LV_4.list = list
      .filter(v => v.name.indexOf(SCD_LEVEL.LV_4.name) >= 0 && !find(SCD_LEVEL.LV_3.list, _v => _v.id === v.id))
      .map(removeLevelInName)
    SCD_LEVEL.LV_5.list = list
      .filter(v => v.name.indexOf(SCD_LEVEL.LV_5.name) >= 0 && !find(SCD_LEVEL.LV_4.list, _v => _v.id === v.id))
      .map(removeLevelInName)
    SCD_LEVEL.ALL.list = list
    // debug(list)
    return list
  } catch (e) {
    error(e)
    return []
  }
}
