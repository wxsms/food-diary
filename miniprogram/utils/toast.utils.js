export const TOAST_ERRORS = {
  NETWORK_ERR: '网络出小差了，请稍后再试'
}

export const LOADING_TEXTS = {
  LOADING: '加载中...',
  CALCULATING: '计算中...',
  RECORDING: '记录中...',
  SAVING: '正在保存...',
  DELETING: '正在删除...',
  EXPORTING: '导出中...'
}

export function loading (show = true, text = LOADING_TEXTS.LOADING) {
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
