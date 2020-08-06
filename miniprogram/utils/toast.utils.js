export function loading (show = true, text = '加载中...') {
  if (show) {
    wx.showLoading({
      mask: true,
      title: text
    })
  } else {
    wx.hideLoading()
  }
}

export function toast (text, icon = 'none') {
  wx.showToast({
    title: text,
    icon: icon,
    duration: 2000
  })
}
