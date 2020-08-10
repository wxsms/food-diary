import { debug } from '../utils/log.utils'

const themeColors = {
  'light': {
    'navigationBarBackgroundColor': '#ebebeb',
    'navigationBarTextStyle': 'rgba(0, 0, 0, .9)'
  },
  'dark': {
    'navigationBarBackgroundColor': '#191919',
    'navigationBarTextStyle': 'hsla(0, 0%, 100%, .8)'
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
        wx.onThemeChange(this.themeChanged.bind(this))
      }
    },
    detached () {
      if (typeof wx.offThemeChange === 'function') {
        wx.offThemeChange(this.themeChanged.bind(this))
      }
    },
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
