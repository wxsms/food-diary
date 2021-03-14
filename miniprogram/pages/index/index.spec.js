const WEEK_DAYS = {
  '1': '星期一',
  '2': '星期二',
  '3': '星期三',
  '4': '星期四',
  '5': '星期五',
  '6': '星期六',
  '0': '星期日'
}

describe('首页', () => {
  require('../../tests/setup')

  let page

  beforeAll(async () => {
    page = await global.mp.reLaunch('/pages/index/index')
  })

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

  it('正常显示昨天日期', async () => {
    const view = await page.$('date-nav')
    const today = await view.$('.date.yesterday text')
    const date = new Date()
    date.setDate(date.getDate() - 1)
    const day = date.getDate()
    const month = date.getMonth() + 1

    expect((await today.text()).trim()).toEqual(`${month}月${day}日`)
  })

  it('正常显示明天日期', async () => {
    const view = await page.$('date-nav')
    const today = await view.$('.date.tomorrow text')
    const date = new Date()
    date.setDate(date.getDate() + 1)
    const day = date.getDate()
    const month = date.getMonth() + 1

    expect((await today.text()).trim()).toEqual(`${month}月${day}日`)
  })

  it('“添加”按钮正常打开 ActionSheet', async () => {
    const as = await page.$('mp-actionsheet')
    const mask = await as.$('.weui-mask')
    expect(await mask.attribute('class')).toContain('weui-mask_hidden')

    const btn = await page.$('#btn-add')
    await btn.tap()
    await page.waitFor(500)
    expect(await mask.attribute('class')).not.toContain('weui-mask_hidden')

    const closeBtn = await as.$('.weui-actionsheet__action .weui-actionsheet__cell')
    await closeBtn.tap()
    await page.waitFor(500)
    expect(await mask.attribute('class')).toContain('weui-mask_hidden')
  })

  it('点击“日历”正常跳转至编辑', async () => {
    const btn = await page.$('#btn-calendar')
    await btn.tap()
    await page.waitFor(500)
    page = await global.mp.currentPage()
    expect(page.path).toContain('pages/modules/diary/pages/calendar/calendar')
    const btn2 = await page.$('#btn-back')
    await btn2.tap()
    await page.waitFor(500)
    page = await global.mp.currentPage()
  })

  it('点击“早餐”正常跳转至编辑', async () => {
    const as = await page.$('mp-actionsheet')
    const btn = await page.$('#btn-add')
    await btn.tap()
    await page.waitFor(500)
    const btn1 = (await as.$$('.weui-actionsheet__cell'))[0]
    await btn1.tap()
    await page.waitFor(500)
    page = await global.mp.currentPage()
    expect(page.path).toContain('pages/modules/diary/pages/edit/edit')
    expect(page.query.diaryOptionIndex).toEqual('0')
    const btn2 = await page.$('#btn-back')
    await btn2.tap()
    await page.waitFor(500)
    page = await global.mp.currentPage()
  })

  it('点击“午餐”正常跳转至编辑', async () => {
    const as = await page.$('mp-actionsheet')
    const btn = await page.$('#btn-add')
    await btn.tap()
    await page.waitFor(500)
    const btn1 = (await as.$$('.weui-actionsheet__cell'))[1]
    await btn1.tap()
    await page.waitFor(500)
    page = await global.mp.currentPage()
    expect(page.path).toContain('pages/modules/diary/pages/edit/edit')
    expect(page.query.diaryOptionIndex).toEqual('1')
    const btn2 = await page.$('#btn-back')
    await btn2.tap()
    await page.waitFor(500)
    page = await global.mp.currentPage()
  })

  it('点击“晚餐”正常跳转至编辑', async () => {
    const as = await page.$('mp-actionsheet')
    const btn = await page.$('#btn-add')
    await btn.tap()
    await page.waitFor(500)
    const btn1 = (await as.$$('.weui-actionsheet__cell'))[2]
    await btn1.tap()
    await page.waitFor(500)
    page = await global.mp.currentPage()
    expect(page.path).toContain('pages/modules/diary/pages/edit/edit')
    expect(page.query.diaryOptionIndex).toEqual('2')
    const btn2 = await page.$('#btn-back')
    await btn2.tap()
    await page.waitFor(500)
    page = await global.mp.currentPage()
  })

  it('点击“补充”正常跳转至编辑', async () => {
    const as = await page.$('mp-actionsheet')
    const btn = await page.$('#btn-add')
    await btn.tap()
    await page.waitFor(500)
    const btn1 = (await as.$$('.weui-actionsheet__cell'))[3]
    await btn1.tap()
    await page.waitFor(500)
    page = await global.mp.currentPage()
    expect(page.path).toContain('pages/modules/diary/pages/edit/edit')
    expect(page.query.diaryOptionIndex).toEqual('3')
    const btn2 = await page.$('#btn-back')
    await btn2.tap()
    await page.waitFor(500)
    page = await global.mp.currentPage()
  })

  it('点击“状况”正常跳转至编辑', async () => {
    const as = await page.$('mp-actionsheet')
    const btn = await page.$('#btn-add')
    await btn.tap()
    await page.waitFor(500)
    const btn1 = (await as.$$('.weui-actionsheet__cell'))[4]
    await btn1.tap()
    await page.waitFor(500)
    page = await global.mp.currentPage()
    expect(page.path).toContain('pages/modules/diary/pages/edit/edit')
    expect(page.query.diaryOptionIndex).toEqual('4')
    const btn2 = await page.$('#btn-back')
    await btn2.tap()
    await page.waitFor(500)
    page = await global.mp.currentPage()
  })

  it('点击“其它”正常跳转至编辑', async () => {
    const as = await page.$('mp-actionsheet')
    const btn = await page.$('#btn-add')
    await btn.tap()
    await page.waitFor(500)
    const btn1 = (await as.$$('.weui-actionsheet__cell'))[5]
    await btn1.tap()
    await page.waitFor(500)
    page = await global.mp.currentPage()
    expect(page.path).toContain('pages/modules/diary/pages/edit/edit')
    expect(page.query.diaryOptionIndex).toEqual('5')
    const btn2 = await page.$('#btn-back')
    await btn2.tap()
    await page.waitFor(500)
    page = await global.mp.currentPage()
  })

  it('点击“异常”正常跳转至编辑', async () => {
    const as = await page.$('mp-actionsheet')
    const btn = await page.$('#btn-add')
    await btn.tap()
    await page.waitFor(500)
    const btn1 = (await as.$$('.weui-actionsheet__cell'))[6]
    await btn1.tap()
    await page.waitFor(500)
    page = await global.mp.currentPage()
    expect(page.path).toContain('pages/modules/diary/pages/edit/edit')
    expect(page.query.diaryOptionIndex).toEqual('6')
    const btn2 = await page.$('#btn-back')
    await btn2.tap()
    await page.waitFor(500)
    page = await global.mp.currentPage()
  })
})
