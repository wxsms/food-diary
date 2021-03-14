const { goEdit, backEdit } = require('../../../../../tests/test.utils')
const { edit } = require('../../../../../tests/data')

describe('编辑日记', () => {
  require('../../../../../tests/setup')

  let page = null

  function createEitSuit (index, name, key, foods) {
    const isStatus = index === 4

    describe(name, () => {
      beforeAll(async () => {
        await global.mp.callWxMethod('removeStorage', {
          key: `cache_${key}`
        })
        page = await goEdit(page, index)
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
        expect(await desc.text()).toContain(name)
      })

      it('正常显示保存按钮', async () => {
        const form = await page.$('mp-form')
        const btn = await form.$('#btn-save')
        expect(btn).not.toBeNull()
        expect(await btn.text()).toContain('保存')
        expect(await btn.property('type')).toEqual('primary')
      })

      it('正常显示返回按钮', async () => {
        const form = await page.$('mp-form')
        const btn = await form.$('#btn-back')
        expect(btn).not.toBeNull()
        expect(await btn.text()).toContain('返回')
        expect(await btn.property('type')).toEqual('default')
      })

      it('无内容时不显示删除按钮', async () => {
        const form = await page.$('mp-form')
        const btn = await form.$('#btn-delete')
        expect(btn).toBeNull()
      })

      it('非“状态”不显示状态输入，“状态”不显示常规输入', async () => {
        const form = await page.$('mp-form')
        const cells = await form.$('mp-cells')
        if (isStatus) {
          expect(cells).not.toBeNull()
        } else {
          expect(cells).toBeNull()
        }
      })

      if (!isStatus) {
        it('首次进入不显示缓存', async () => {
          const form = await page.$('mp-form')
          const recentV = await form.$('#recent-view')
          expect(recentV).toBeNull()
        })

        it('正确保存用户首次输入内容', async () => {
          const form = await page.$('mp-form')
          const textarea = await form.$('textarea')
          await textarea.input(foods[0])
          expect(await textarea.value()).toEqual(foods[0])

          const btn = await form.$('#btn-save')
          await btn.tap()
          await page.waitFor(500)
          page = await global.mp.currentPage()

          const card = (await page.$$('card'))[index]
          const badge = await card.$('.card-badge')
          const text = await card.$('text')
          expect(await badge.text()).toEqual(name)
          expect(await text.text()).toEqual(foods[0])

          page = await goEdit(page, index)
        })

        it('有内容时显示删除按钮', async () => {
          const form = await page.$('mp-form')
          const btn = await form.$('#btn-delete')
          expect(btn).not.toBeNull()
          expect(await btn.text()).toContain('删除')
          expect(await btn.property('type')).toEqual('warn')
        })

        it('正确缓存用户首次输入内容', async () => {
          const form = await page.$('mp-form')
          const recentB = await form.$$('#recent-view button')
          expect(recentB.length).toEqual(1)
          expect(await recentB[0].text()).toEqual(foods[0])
        })

        it('正确保存用户二次输入内容', async () => {
          const form = await page.$('mp-form')
          const textarea = await form.$('textarea')
          expect(await textarea.value()).toEqual(foods[0])

          await textarea.input(foods.join('\n'))
          expect(await textarea.value()).toEqual(foods.join('\n'))

          const btn = await form.$('#btn-save')
          await btn.tap()
          await page.waitFor(500)
          page = await global.mp.currentPage()

          const card = (await page.$$('card'))[index]
          const badge = await card.$('.card-badge')
          const text = await card.$('text')
          expect(await badge.text()).toEqual(name)
          expect(await text.text()).toEqual(foods.join('\n'))

          page = await goEdit(page, index)
        })

        it('正确缓存用户二次输入内容', async () => {
          const form = await page.$('mp-form')
          const recentB = await form.$$('#recent-view button')
          expect(recentB.length).toEqual(3)
          expect(await recentB[0].text()).toEqual(foods[2])
          expect(await recentB[1].text()).toEqual(foods[1])
          expect(await recentB[2].text()).toEqual(foods[0])
        })

        it('正确使用缓存进行输入', async () => {
          const form = await page.$('mp-form')
          const textarea = await form.$('textarea')
          const recentB = await form.$$('#recent-view button')
          expect(recentB.length).toEqual(3)

          await textarea.input('')
          expect(await textarea.value()).toEqual('')
          await recentB[2].tap()
          expect(await textarea.value()).toEqual(foods[0])
          await recentB[0].tap()
          expect(await textarea.value()).toEqual(`${foods[0]}\n${foods[2]}`)
          await recentB[1].tap()
          expect(await textarea.value()).toEqual(`${foods[0]}\n${foods[2]}\n${foods[1]}`)

          const btn = await form.$('#btn-save')
          await btn.tap()
          await page.waitFor(500)
          page = await global.mp.currentPage()

          const card = (await page.$$('card'))[index]
          const badge = await card.$('.card-badge')
          const text = await card.$('text')
          expect(await badge.text()).toEqual(name)
          expect(await text.text()).toEqual(`${foods[0]}\n${foods[2]}\n${foods[1]}`)
        })
      } else {
        it('正确保存用户首次输入内容', async () => {
          const form = await page.$('mp-form')
          const cells = await form.$('mp-cells')
          const cell = await cells.$$('mp-cell')
          const input1 = await cell[0].$('input')
          const input2 = await cell[1].$('input')
          const input3 = await cell[2].$('input')

          await input1.input(foods[0].toString())
          await input2.input(foods[1].toString())
          await input3.input(foods[2])

          const btn = await form.$('#btn-save')
          await btn.tap()
          await page.waitFor(500)
          page = await global.mp.currentPage()

          const card = (await page.$$('card'))[index]
          const badge = await card.$('.card-badge')
          const text = await card.$$('text')
          expect(await badge.text()).toEqual(name)
          expect((await text[0].text()).trim()).toEqual(`体重：${foods[0]}kg`)
          expect((await text[1].text()).trim()).toEqual(`排便：${foods[1]}次`)
          expect((await text[2].text()).trim()).toEqual(`排便情况：${foods[2]}`)

          page = await goEdit(page, index)
        })

        it('正确保存用户二次输入内容', async () => {
          const form = await page.$('mp-form')
          const cells = await form.$('mp-cells')
          const cell = await cells.$$('mp-cell')
          const input1 = await cell[0].$('input')
          const input2 = await cell[1].$('input')
          const input3 = await cell[2].$('input')

          expect(await input1.value()).toEqual(foods[0].toString())
          expect(await input2.value()).toEqual(foods[1].toString())
          expect(await input3.value()).toEqual(foods[2])

          await input1.input(foods[1].toString())
          await input2.input(foods[0].toString())
          await input3.input(foods[2] + '123')

          const btn = await form.$('#btn-save')
          await btn.tap()
          await page.waitFor(500)
          page = await global.mp.currentPage()

          const card = (await page.$$('card'))[index]
          const badge = await card.$('.card-badge')
          const text = await card.$$('text')
          expect(await badge.text()).toEqual(name)
          expect((await text[0].text()).trim()).toEqual(`体重：${foods[1]}kg`)
          expect((await text[1].text()).trim()).toEqual(`排便：${foods[0]}次`)
          expect((await text[2].text()).trim()).toEqual(`排便情况：${foods[2]}123`)
        })
      }
    })
  }

  beforeAll(async () => {
    await global.mp.mockWxMethod('showModal', {
      confirm: true,
      cancel: false
    })
    page = await global.mp.reLaunch('/pages/index/index')
  })

  for (const e of edit) {
    createEitSuit(...e)
  }

  describe('删除', () => {
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
