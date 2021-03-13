const { setup, destroy } = require('../../../../tests/globalSetup')

describe('发现', () => {
  let page

  beforeAll(async () => {
    const { _page } = await setup('/pages/tabbar/pages/discover/discover')
    page = _page
  }, 60000)

  afterAll(async () => {
    await destroy()
  })

  it('正常显示“CDAI 评分”功能', async () => {
    const cell = await page.$('mp-cells')
    const cells = await cell.$$('mp-cell')
    expect(await cells[0].property('title')).toEqual('CDAI 评分')
  })

  it('正常显示“类克用药记录”功能', async () => {
    const cell = await page.$('mp-cells')
    const cells = await cell.$$('mp-cell')
    expect(await cells[1].property('title')).toEqual('类克用药记录')
  })
})
