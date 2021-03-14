const { WEEK_DAYS, goEdit, backEdit } = require('../../tests/test.utils')

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
    page = await goEdit(page, 0)
    expect(page.path).toContain('pages/modules/diary/pages/edit/edit')
    expect(page.query.diaryOptionIndex).toEqual('0')
    page = await backEdit(page)
  })

  it('点击“午餐”正常跳转至编辑', async () => {
    page = await goEdit(page, 1)
    expect(page.path).toContain('pages/modules/diary/pages/edit/edit')
    expect(page.query.diaryOptionIndex).toEqual('1')
    page = await backEdit(page)
  })

  it('点击“晚餐”正常跳转至编辑', async () => {
    page = await goEdit(page, 2)
    expect(page.path).toContain('pages/modules/diary/pages/edit/edit')
    expect(page.query.diaryOptionIndex).toEqual('2')
    page = await backEdit(page)
  })

  it('点击“补充”正常跳转至编辑', async () => {
    page = await goEdit(page, 3)
    expect(page.path).toContain('pages/modules/diary/pages/edit/edit')
    expect(page.query.diaryOptionIndex).toEqual('3')
    page = await backEdit(page)
  })

  it('点击“状况”正常跳转至编辑', async () => {
    page = await goEdit(page, 4)
    expect(page.path).toContain('pages/modules/diary/pages/edit/edit')
    expect(page.query.diaryOptionIndex).toEqual('4')
    page = await backEdit(page)
  })

  it('点击“其它”正常跳转至编辑', async () => {
    page = await goEdit(page, 5)
    expect(page.path).toContain('pages/modules/diary/pages/edit/edit')
    expect(page.query.diaryOptionIndex).toEqual('5')
    page = await backEdit(page)
  })

  it('点击“异常”正常跳转至编辑', async () => {
    page = await goEdit(page, 6)
    expect(page.path).toContain('pages/modules/diary/pages/edit/edit')
    expect(page.query.diaryOptionIndex).toEqual('6')
    page = await backEdit(page)
  })
})
