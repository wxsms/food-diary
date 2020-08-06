//app.js
import { error } from './utils/log.utils'

App({
  onLaunch () {
    Promise.prototype.finally = function (callback) {
      const P = this.constructor
      return this.then(
        value => P.resolve(callback()).then(() => value),
        reason => P.resolve(callback()).then(() => {throw reason })
      )
    }
    if (!wx.cloud) {
      error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'dev-prpyj',
        traceUser: true
      })
    }
    this.globalData = {}
  }
})
