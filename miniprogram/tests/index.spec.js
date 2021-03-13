const automator = require('miniprogram-automator')
const path = require('path')

describe('tests', () => {
  let page, mp

  beforeAll(async () => {
    mp = await automator.launch({
      // cliPath: '/Applications/wechatwebdevtools.app/Contents/MacOS/cli',
      cliPath: 'E:/Program Files (x86)/Tencent/微信web开发者工具/cli.bat',
      projectPath: path.join(__dirname, '..', '..'),
    })
    page = await mp.reLaunch('/pages/index/index')
    await page.waitFor(500)
    global.mp = mp
    global.page = page
  }, 60000)

  afterAll(async () => {
    await mp.close()
  })

  require('../pages/index/index.spec')
  require('../pages/tabbar/pages/discover/discover.spec')
})
