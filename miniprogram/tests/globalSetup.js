const automator = require('miniprogram-automator')
const path = require('path')

let _mp, _page

module.exports.setup = async (initPath = '/pages/index/index') => {
  _mp = await automator.launch({
    // cliPath: '/Applications/wechatwebdevtools.app/Contents/MacOS/cli',
    cliPath: 'E:/Program Files (x86)/Tencent/微信web开发者工具/cli.bat',
    projectPath: path.join(__dirname, '..', '..'),
  })
  _page = await _mp.reLaunch(initPath)
  await _page.waitFor(500)
  return { _mp, _page }
}

module.exports.destroy = async () => {
  await _mp.close()
}

