export const SCD_LEVEL = {
  LV_0: {
    name: '基础',
    list: []
  },
  LV_1: {
    name: '第一',
    list: []
  },
  LV_2: {
    name: '第二',
    list: []
  },
  LV_3: {
    name: '第三',
    list: []
  },
  LV_4: {
    name: '第四',
    list: []
  },
  LV_5: {
    name: '第五',
    list: []
  }
}

async function getFoodsByName (name) {
  try {
    const { result: { data } } = await wx.cloud.callFunction({
      name: 'scd-foods',
      data: { name }
    })
    return data || []
  } catch (e) {
    return false
  }
}

export async function getByLevel (level = SCD_LEVEL.LV_0) {
  if (level.list.length) {
    return level.list
  } else {
    const data = await getFoodsByName(level.name)
    level.list = data || []
    return data
  }
}
