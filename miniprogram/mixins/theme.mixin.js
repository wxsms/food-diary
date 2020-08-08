import { debug } from '../utils/log.utils'

module.exports = Behavior({
  data: {
    theme: 'light'
  },
  lifetimes: {
    async attached () {
      const sysInfo = await wx.getSystemInfo()
      debug('theme init:', sysInfo.theme)
      this.themeChanged(sysInfo)
      wx.onThemeChange(this.themeChanged.bind(this))
    },
    detached () {
      wx.offThemeChange(this.themeChanged.bind(this))
    },
  },
  methods: {
    themeChanged ({ theme }) {
      // debug(this)
      debug('theme changed:', theme)
      this.setData({
        theme
      })
    }
  }
})
