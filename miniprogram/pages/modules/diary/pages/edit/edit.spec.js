const { goEdit, backEdit } = require('../../../../../tests/test.utils')

describe('编辑日记', () => {
  require('../../../../../tests/setup')

  let page

  beforeAll(async () => {
    await global.mp.callWxMethod('removeStorage', {
      key: 'cache_breakfast'
    })
    await global.mp.mockWxMethod('showModal', {
      confirm: true,
      cancel: false
    })
    page = await global.mp.reLaunch('/pages/index/index')
  })

  describe('早餐', () => {
    beforeAll(async () => {
      page = await goEdit(page, 0)
    })

    afterAll(async () => {
      await global.mp.restoreWxMethod('showModal')
    })

    it('正确显示日期与类型', async () => {
      const title = await page.$('.page__title')
      const desc = await page.$('.page__desc')
      const date = new Date()
      const year = date.getFullYear()
      const day = date.getDate()
      const month = date.getMonth() + 1

      expect(await title.text()).toEqual(`${year}年${month}月${day}日`)
      expect(await desc.text()).toContain(`早餐`)
    })

    it('正常显示保存按钮', async () => {
      const form = await page.$('mp-form')
      const btn = await form.$('#btn-save')
      expect(btn).not.toBeNull()
      expect(await btn.text()).toContain('保存')
    })

    it('正常显示返回按钮', async () => {
      const form = await page.$('mp-form')
      const btn = await form.$('#btn-back')
      expect(btn).not.toBeNull()
      expect(await btn.text()).toContain('返回')
    })

    it('无内容时不显示删除按钮', async () => {
      const form = await page.$('mp-form')
      const btn = await form.$('#btn-delete')
      expect(btn).toBeNull()
    })

    it('首次进入不显示缓存', async () => {
      const form = await page.$('mp-form')
      const recentV = await form.$('#recent-view')
      expect(recentV).toBeNull()
    })

    it('正确保存用户首次输入内容', async () => {
      const form = await page.$('mp-form')
      const textarea = await form.$('textarea')
      await textarea.input('鸡肉')
      expect(await textarea.value()).toEqual('鸡肉')

      const btn = await form.$('#btn-save')
      await btn.tap()
      await page.waitFor(500)
      page = await global.mp.currentPage()

      const card = (await page.$$('card'))[0]
      const badge = await card.$('.card-badge')
      const text = await card.$('text')
      expect(await badge.text()).toEqual('早餐')
      expect(await text.text()).toEqual('鸡肉')

      page = await goEdit(page, 0)
    })

    it('正确缓存用户首次输入内容', async () => {
      const form = await page.$('mp-form')
      const recentB = await form.$$('#recent-view button')
      expect(recentB.length).toEqual(1)
      expect(await recentB[0].text()).toEqual('鸡肉')
    })

    it('正确保存用户二次输入内容', async () => {
      const form = await page.$('mp-form')
      const textarea = await form.$('textarea')
      expect(await textarea.value()).toEqual('鸡肉')

      await textarea.input('鸡肉\n胡萝卜\n盐')
      expect(await textarea.value()).toEqual('鸡肉\n胡萝卜\n盐')

      const btn = await form.$('#btn-save')
      await btn.tap()
      await page.waitFor(500)
      page = await global.mp.currentPage()

      const card = (await page.$$('card'))[0]
      const badge = await card.$('.card-badge')
      const text = await card.$('text')
      expect(await badge.text()).toEqual('早餐')
      expect(await text.text()).toEqual('鸡肉\n胡萝卜\n盐')

      page = await goEdit(page, 0)
    })

    it('正确缓存用户二次输入内容', async () => {
      const form = await page.$('mp-form')
      const recentB = await form.$$('#recent-view button')
      expect(recentB.length).toEqual(3)
      expect(await recentB[0].text()).toEqual('盐')
      expect(await recentB[1].text()).toEqual('胡萝卜')
      expect(await recentB[2].text()).toEqual('鸡肉')
    })

    it('正确使用缓存进行输入', async () => {
      const form = await page.$('mp-form')
      const textarea = await form.$('textarea')
      const recentB = await form.$$('#recent-view button')
      expect(recentB.length).toEqual(3)

      await textarea.input('')
      expect(await textarea.value()).toEqual('')
      await recentB[2].tap()
      expect(await textarea.value()).toEqual('鸡肉')
      await recentB[0].tap()
      expect(await textarea.value()).toEqual('鸡肉\n盐')
      await recentB[1].tap()
      expect(await textarea.value()).toEqual('鸡肉\n盐\n胡萝卜')

      const btn = await form.$('#btn-save')
      await btn.tap()
      await page.waitFor(500)
      page = await global.mp.currentPage()

      const card = (await page.$$('card'))[0]
      const badge = await card.$('.card-badge')
      const text = await card.$('text')
      expect(await badge.text()).toEqual('早餐')
      expect(await text.text()).toEqual('鸡肉\n盐\n胡萝卜')

      page = await goEdit(page, 0)
    })
  })

  describe('删除', () => {
    beforeAll(async () => {
      page = await backEdit(page)
    })

    it('正确删除内容', async () => {
      const cards = await page.$$('card')
      for (const _card of cards) {
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

        const card = (await page.$$('card'))[0]
        const badge = await card.$('.card-badge')
        const text = await card.$('text')
        expect(badge).toBeNull()
        expect(text).toBeNull()
      }
    })
  })
})
