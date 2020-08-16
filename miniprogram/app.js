App({
  onLaunch () {
    Promise.prototype.finally = function (callback) {
      const P = this.constructor
      return this.then(
        value => P.resolve(callback()).then(() => value),
        reason => P.resolve(callback()).then(() => {throw reason })
      )
    }
    wx.setBackgroundFetchToken({ token: 'scd-foods' })
    wx.cloud.init({
      env: 'dev-prpyj',
      traceUser: true
    })
    this.globalData = {}
  }
})
