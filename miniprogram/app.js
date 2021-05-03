import { debug } from './utils/log.utils'

App({
  onLaunch () {
    Promise.prototype.finally = function (callback) {
      const P = this.constructor
      return this.then(
        value => P.resolve(callback()).then(() => value),
        reason => P.resolve(callback()).then(() => {throw reason })
      )
    }
    // wx.setBackgroundFetchToken({ token: 'scd-foods' })
    // 1. 正式环境：dev-prpyj
    // 2. 测试环境：test-5gowurs5e7bd49ed
    wx.cloud.init({
      env: 'dev-prpyj',
      traceUser: true
    })
    this.globalData = {}

    // 更新检测
    const updateManager = wx.getUpdateManager()

    updateManager.onCheckForUpdate(function (res) {
      // 请求完新版本信息的回调
      debug('onCheckForUpdate', res)
    })

    updateManager.onUpdateReady(function () {
      debug('onUpdateReady')
      wx.showModal({
        title: '更新提示',
        content: '新版本已准备好，是否重启？',
        success: function (res) {
          if (res.confirm) {
            // 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
            updateManager.applyUpdate()
          }
        }
      })
    })

    updateManager.onUpdateFailed(function () {
      // 新版本下载失败
      debug('onUpdateFailed')
    })
  }
})
