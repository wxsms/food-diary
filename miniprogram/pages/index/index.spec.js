const { setup, destroy } = require('../../tests/globalSetup')

describe('首页', () => {
  let page

  beforeAll(async () => {
    const { _page } = await setup()
    page = _page
  }, 60000)

  afterAll(async () => {
    await destroy()
  })

  it('正常显示“添加”按钮', async () => {
    const btns = await page.$$('.btns .weui-btn')
    expect(await btns[0].property('type')).toEqual('primary')
    expect(await btns[0].text()).toContain('添加')
  })

  it('正常显示“日历”按钮', async () => {
    const btns = await page.$$('.btns .weui-btn')
    expect(await btns[1].property('type')).toEqual('default')
    expect(await btns[1].text()).toContain('日历')
  })
})
