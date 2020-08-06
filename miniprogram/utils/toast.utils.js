export function loading (show = true) {
  if (show) {
    wx.showLoading({
      mask: true,
      title: '加载中...'
    })
  } else {
    wx.hideLoading()
  }
}
