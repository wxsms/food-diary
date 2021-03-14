const WEEK_DAYS = {
  '1': '星期一',
  '2': '星期二',
  '3': '星期三',
  '4': '星期四',
  '5': '星期五',
  '6': '星期六',
  '0': '星期日'
}

module.exports = {
  WEEK_DAYS,
  async goEdit (page, index) {
    const as = await page.$('mp-actionsheet')
    const btn = await page.$('#btn-add')
    await btn.tap()
    await page.waitFor(500)
    const btn1 = (await as.$$('.weui-actionsheet__cell'))[index]
    await btn1.tap()
    await page.waitFor(500)
    return await global.mp.currentPage()
  },
  async backEdit (page) {
    const btn2 = await page.$('#btn-back')
    await btn2.tap()
    await page.waitFor(500)
    return await global.mp.currentPage()
  },
  async deleteAllCardsOnPage (page) {
    const cards = await page.$$('card')
    for (const _card of cards) {
      const index = cards.indexOf(_card)
      const _view = await _card.$('.card')
      if (!_view) {
        continue
      }

      await _view.tap()
      await page.waitFor(500)
      page = await global.mp.currentPage()

      const form = await page.$('mp-form')
      const btn = await form.$('#btn-delete')
      await btn.tap()
      await page.waitFor(500)
      page = await global.mp.currentPage()

      const card = (await page.$$('card'))[index]
      if (card) {
        const badge = await card.$('.card-badge')
        const text = await card.$('text')
        expect(badge).toBeNull()
        expect(text).toBeNull()
      }
    }
    return page
  }
}
