import { DIARY_OPTION_LIST, DIARY_TYPES } from '../../constants/index'
import { getCache, cacheInput, cacheDelete } from '../../store/recent-record.store'
import { isReview } from '../../utils/version.utils'
import { getByLevel, SCD_LEVEL } from '../../store/scd-foods.store'
import { debug, error } from '../../utils/log.utils'
import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import { store } from '../../store/store'
import { loading, toast } from '../../utils/toast.utils'
import { nextTick } from '../../utils/wx.utils'
import theme from '../../mixins/theme.mixin'

const app = getApp()

Component({
  behaviors: [storeBindingsBehavior, theme],
  data: {
    type: null,
    showWeight: false,
    showDefecation: false,
    record: null,
    value: '',
    weight: '',
    defecation: '',
    recent: [],
    othersRecent: ['体重', '排便', '异常'],
    scdFoods: [],
    isReview: false,
    loaded: false
  },
  storeBindings: {
    store,
    fields: {
      currentDateStr: store => store.currentDateStr,
      currentDate: store => store.currentDate,
      currentDateTs: store => store.currentDateTs
    },
    actions: {
      setCurrentDate: 'setCurrentDate',
      setCurrentMonth: 'setCurrentMonth'
    }
  },
  methods: {
    onShareAppMessage () {
      return {
        title: 'IBD日记',
        path: '/pages/index/index'
      }
    },
    async onLoad ({ diaryOptionIndex }) {
      loading()
      const type = DIARY_OPTION_LIST[Number(diaryOptionIndex)]
      const isOthers = type.key === DIARY_TYPES.OTHERS.key
      this.setData({
        type,
        showWeight: isOthers,
        showDefecation: isOthers,
        recent: getCache(type.key)
      })
      await nextTick()
      await this.fetchScdData()
      await this.fetchData()
    },
    async fetchScdData () {
      try {
        const _isReview = await isReview()
        if (_isReview) {
          let _scdFoods = []
          const data = await Promise.all([
            getByLevel(SCD_LEVEL.LV_0),
            getByLevel(SCD_LEVEL.LV_1),
            getByLevel(SCD_LEVEL.LV_2)
          ])
          data.forEach(v => {
            _scdFoods = _scdFoods.concat(v.map(v => v.name))
          })
          this.setData({
            loaded: true,
            scdFoods: _scdFoods,
            isReview: _isReview
          })
        } else {
          this.setData({
            loaded: true
          })
        }
      } catch (e) {
        error(e)
      }
    },
    async fetchData () {
      const db = wx.cloud.database()
      try {
        loading()
        // debug('currentDateTs', this.data.currentDateTs)
        const { data } = await db.collection('records').where({
          _openid: app.globalData.openid,
          date: this.data.currentDateTs
        }).get()
        const record = data[0]
        if (record) {
          this.setData({
            record,
            value: record[this.data.type.key] || '',
            weight: typeof record[DIARY_TYPES.WEIGHT.key] === 'number' ? record[DIARY_TYPES.WEIGHT.key] : '',
            defecation: typeof record[DIARY_TYPES.DEFECATION.key] === 'number' ? record[DIARY_TYPES.DEFECATION.key] : ''
          })
        }
      } catch (e) {
        error(e)
        toast('获取数据失败')
      } finally {
        loading(false)
      }
    },
    onChange ({ detail: { value } }) {
      this.setData({ value })
    },
    onWeightChange ({ detail: { value } }) {
      this.setData({ weight: value })
    },
    onDefecationChange ({ detail: { value } }) {
      this.setData({ defecation: value })
    },
    onRecentClick ({ currentTarget: { dataset: { value } } }) {
      this.setData({
        value: (this.data.value + '\n' + value).trim()
      })
    },
    onRecentDelete ({ currentTarget: { dataset: { value } } }) {
      wx.showModal({
        content: '删除本项？',
        confirmText: '删除',
        confirmColor: '#fa5151',
        success: (res) => {
          if (res.confirm) {
            this.setData({
              recent: cacheDelete(this.data.type.key, value)
            })
          }
        }
      })
    },
    async doSave () {
      const hasValue = !!this.data.value
      const hasWeight = this.data.showWeight ? !!this.data.weight : false
      const hasDefecation = this.data.showDefecation ? !!this.data.defecation : false
      const hasContent = hasValue || hasWeight || hasDefecation

      if (!hasContent) {
        toast('写点东西吧')
        return
      }

      const weightInvalid = this.data.showWeight ? Number.isNaN(Number(this.data.weight)) : false
      if (weightInvalid) {
        toast('体重需输入数字')
        return
      }
      const defecationInvalid = this.data.showDefecation ? Number.isNaN(Number(this.data.defecation)) : false
      if (defecationInvalid) {
        toast('排便次数需输入数字')
        return
      }

      loading(true, '正在保存...')
      const db = wx.cloud.database()
      const toSave = {
        [this.data.type.key]: this.data.value
      }
      if (this.data.showWeight) {
        toSave[DIARY_TYPES.WEIGHT.key] = Number(this.data.weight)
      }
      if (this.data.showDefecation) {
        toSave[DIARY_TYPES.DEFECATION.key] = Number(this.data.defecation)
      }
      try {
        if (this.data.record) {
          await db.collection('records').doc(this.data.record._id).update({
            data: toSave
          })
        } else {
          await db.collection('records').add({
            data: {
              date: this.data.currentDateTs,
              ...toSave
            }
          })
        }
        cacheInput(this.data.type.key, this.data.value)
        app.globalData.needReload = true
        wx.navigateBack()
      } catch (e) {
        error(e)
        toast('出错啦，请稍后重试')
      } finally {
        loading(false)
      }
    },
    deleteRecord () {
      if (!this.data.record) {
        return
      }
      wx.showModal({
        title: '确认',
        content: '记录删除后将无法恢复',
        confirmText: '删除',
        confirmColor: '#fa5151',
        cancelText: '取消',
        success: ({ confirm }) => {
          if (confirm) {
            loading(true, '正在删除...')
            let keyCount = 0
            DIARY_OPTION_LIST.forEach(v => {
              if (v.key !== this.data.type.key && this.data.record[v.key]) {
                keyCount++
              }
            })
            const db = wx.cloud.database()
            if (keyCount > 0) {
              db.collection('records').doc(this.data.record._id).update({
                data: {
                  [this.data.type.key]: ''
                }
              })
                .then(res => {
                  app.globalData.needReload = true
                  wx.navigateBack()
                })
                .finally(() => {
                  loading(false)
                })
            } else {
              db.collection('records').doc(this.data.record._id).remove()
                .then(res => {
                  app.globalData.needReload = true
                  wx.navigateBack()
                })
                .finally(() => {
                  loading(false)
                })
            }
          }
        }
      })
    },
    onScdFoodChange ({ detail: { value } }) {
      this.setData({
        value: (this.data.value + '\n' + this.data.scdFoods[value]).trim()
      })
    }
  }
})
