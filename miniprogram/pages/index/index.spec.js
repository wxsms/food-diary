const WEEK_DAYS = {
  '1': '星期一',
  '2': '星期二',
  '3': '星期三',
  '4': '星期四',
  '5': '星期五',
  '6': '星期六',
  '0': '星期日'
}

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

  it('正常显示今天日期', async () => {
    const view = await page.$('date-nav')
    const today = await view.$$('.date.today text')
    const date = new Date()
    const year = date.getFullYear()
    const day = date.getDate()
    const month = date.getMonth() + 1

    expect(await today[0].text()).toEqual(`${year}年${month}月${day}日`)
    expect(await today[1].text()).toEqual(WEEK_DAYS[date.getDay()])
  })
})
