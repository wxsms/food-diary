module.exports = describe('首页', () => {
  let page

  beforeAll(async () => {
    page = await global.mp.reLaunch('/pages/index/index')
    await page.waitFor(500)
  }, 30000)

  it('正常显示“添加”按钮', async () => {
    const btn = await page.$('#btn-add')
    expect(await btn.property('type')).toEqual('primary')
    expect(await btn.text()).toContain('添加')
  })

  it('正常显示“日历”按钮', async () => {
    const btn = await page.$('#btn-calendar')
    expect(await btn.property('type')).toEqual('default')
    expect(await btn.text()).toContain('日历')
  })

  it('首次进入不显示“同前”按钮', async () => {
    const btn = await page.$('#btn-same')
    expect(btn).toBeNull()
  })
})
