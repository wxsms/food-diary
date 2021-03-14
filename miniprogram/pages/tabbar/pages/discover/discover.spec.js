describe('发现', () => {
  require('../../../../tests/setup')

  let page

  beforeAll(async () => {
    page = await global.mp.reLaunch('/pages/tabbar/pages/discover/discover')
    // await page.waitFor(500)
  }, 30000)

  it('正常显示“CDAI 评分”功能', async () => {
    const cell = await page.$('mp-cells')
    const cells = await cell.$$('mp-cell')
    expect(await (await cells[0].$('.weui-cell__hd')).text()).toEqual('CDAI 评分')
  })

  it('正常显示“类克用药记录”功能', async () => {
    const cell = await page.$('mp-cells')
    const cells = await cell.$$('mp-cell')
    expect(await (await cells[1].$('.weui-cell__hd')).text()).toEqual('类克用药记录')
  })
})
