function _nextTick () {
  return new Promise(resolve => {
    wx.nextTick(resolve)
  })
}

export async function nextTick (times = 1) {
  for (let i = 0; i < times; ++i) {
    await _nextTick()
  }
}
