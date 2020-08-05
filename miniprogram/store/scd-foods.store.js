export let all = []
export let lv0 = []
export let lv1 = []
export let lv2 = []
export let lv3 = []
export let lv4 = []
export let lv5 = []

export const SCD_LEVEL = {
  LV_0: '基础',
  LV_1: '第一',
  LV_2: '第二',
  LV_3: '第三',
  LV_4: '第四',
  LV_5: '第五'
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

function _getByLevel (level) {
  switch (level) {
    case SCD_LEVEL.LV_0:
      return lv0
    case SCD_LEVEL.LV_1:
      return lv1
    case SCD_LEVEL.LV_2:
      return lv2
    case SCD_LEVEL.LV_3:
      return lv3
    case SCD_LEVEL.LV_4:
      return lv4
    case SCD_LEVEL.LV_5:
      return lv5
    default:
      return lv0
  }
}

export async function getByLevel (level = SCD_LEVEL.LV_0) {
  const cached = _getByLevel(level)
  if (cached.length) {
    return cached
  } else {
    return await getFoodsByName(level)
  }
}
