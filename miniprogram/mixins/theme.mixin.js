import { debug } from '../utils/log.utils'

const themeColors = {
  light: {
    navigationBarBackgroundColor: '#ebebeb',
    navigationBarTextStyle: 'rgba(0, 0, 0, .9)',
    chartLineColor: '#07c160',
    chartTextColor: 'rgba(0, 0, 0, .9)',
    chartGridColor: 'rgba(0, 0, 0, 0.2)'
  },
  dark: {
    navigationBarBackgroundColor: '#191919',
    navigationBarTextStyle: 'hsla(0, 0%, 100%, .8)',
    chartLineColor: '#06ad56',
    chartTextColor: 'hsla(0, 0%, 100%, .8)',
    chartGridColor: '#444444'
  }
}

module.exports = Behavior({
  data: {
    theme: 'light',
    themeColors: {
      ...themeColors.light
    }
  },
  lifetimes: {
    async attached () {
      const sysInfo = await wx.getSystemInfo()
      debug('theme init:', sysInfo.theme)
      this.themeChanged(sysInfo)
      if (typeof wx.onThemeChange === 'function') {
        this._themeChanged = this.themeChanged.bind(this)
        wx.onThemeChange(this._themeChanged)
      }
    },
    detached () {
      if (typeof wx.offThemeChange === 'function') {
        wx.offThemeChange(this._themeChanged)
      }
    }
  },
  methods: {
    themeChanged ({ theme }) {
      // debug(this)
      debug('theme changed:', theme)
      if (typeof theme === 'string' && themeColors[theme]) {
        this.setData({
          theme,
          themeColors: {
            ...themeColors[theme]
          }
        })
      }
    }
  }
})
