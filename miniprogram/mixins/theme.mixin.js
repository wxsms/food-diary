import { debug } from '../utils/log.utils'

const themeColors = {
  light: {
    navigationBarBackgroundColor: '#ebebeb',
    navigationBarTextStyle: 'rgba(0, 0, 0, .9)',
    chartLineColors: ['#07c160', '#fa9d3b'],
    chartTextColor: '#333333',
    chartGridColor: '#dddddd'
  },
  dark: {
    navigationBarBackgroundColor: '#191919',
    navigationBarTextStyle: 'hsla(0, 0%, 100%, .8)',
    chartLineColors: ['#06ad56', '#c87d2f'],
    chartTextColor: '#888888',
    chartGridColor: '#333333'
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
