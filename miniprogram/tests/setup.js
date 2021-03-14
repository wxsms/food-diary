const automator = require('miniprogram-automator')
const path = require('path')

let mp

const launchOptions = {
  // cliPath: '/Applications/wechatwebdevtools.app/Contents/MacOS/cli',
  cliPath: 'E:/Program Files (x86)/Tencent/微信web开发者工具/cli.bat',
  projectPath: path.join(__dirname, '..', '..'),
  account: 'o6zAJsylrRFaTsWYMO8-WExne31Y'
}

beforeAll(async () => {
  try {
    mp = await automator.connect({
      wsEndpoint: 'ws://localhost:9420',
    })
  } catch (err) {
    console.error(err)
    try {
      mp = await automator.launch({ ...launchOptions })
      // // 获取测试账号
      // const testAccounts = await mp.testAccounts()
      // console.log('test accounts:', testAccounts)
      // if (testAccounts.length) {
      //   // 如果存在测试号，则使用测试号重新登录
      //   await mp.close()
      //   mp = await automator.launch({
      //     ...launchOptions,
      //     account: testAccounts[0].openid
      //   })
      // }
    } catch (err) {
      console.error(err)
    }
  }

  global.mp = mp
}, 60000)

afterAll(async () => {
  await mp.disconnect()
})
