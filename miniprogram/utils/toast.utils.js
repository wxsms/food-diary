export const TOAST_ERRORS = {
  NETWORK_ERR: '网络出小差了，请稍后再试'
}

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
