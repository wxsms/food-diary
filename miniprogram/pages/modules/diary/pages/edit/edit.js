import { DIARY_OPTION_LIST, DIARY_TYPES } from '../../../../../constants/constants'
import { getCache, cacheInput, cacheDelete } from '../../../../../store/recent-record.store'
import { isReview } from '../../../../../utils/version.utils'
import { getFoods } from '../../../../../store/scd-foods.store'
import { debug, error } from '../../../../../utils/log.utils'
import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import { store } from '../../../../../store/store'
import { loading, toast, TOAST_ERRORS } from '../../../../../utils/toast.utils'
import { nextTick } from '../../../../../utils/wx.utils'
import themeMixin from '../../../../../mixins/theme.mixin'
import shareMixin from '../../../../../mixins/share.mixin'
import get from 'lodash.get'

Component({
  behaviors: [storeBindingsBehavior, themeMixin, shareMixin],
  data: {
    type: null,
    showWeight: false,
    showDefecation: false,
    value: '',
    weight: '',
    defecation: '',
    recent: [],
    othersRecent: ['体重', '排便', '异常'],
    scdFoods: [],
    loaded: false,
    isStatus: false,
    showDelete: false,
    isReview: false
  },
  storeBindings: {
    store,
    fields: {
      currentDateStr: store => store.currentDateStr,
      currentDate: store => store.currentDate,
      currentDateTs: store => store.currentDateTs,
      todayRecord: store => store.todayRecord
    },
    actions: {
      setTodayRecord: 'setTodayRecord'
    }
  },
  methods: {
    onRecentHelp () {
      wx.showModal({
        content: '最多保存 8 条记录，长按以删除',
        confirmText: '知道了',
        showCancel: false
      })
    },
    async onLoad ({ diaryOptionIndex }) {
      const type = DIARY_OPTION_LIST[Number(diaryOptionIndex)]
      const isStatus = type.key === DIARY_TYPES.STATUS.key
      await nextTick()
      const todayRecord = this.data.todayRecord
      const value = get(todayRecord, type.key, '')
      const weight = get(todayRecord, DIARY_TYPES.WEIGHT.key, '')
      const defecation = get(todayRecord, DIARY_TYPES.DEFECATION.key, '')
      let showDelete = false
      if (todayRecord) {
        if (isStatus) {
          showDelete = typeof weight === 'number' || weight === '' || typeof defecation === 'number' || defecation === ''
        } else {
          showDelete = !!value
        }
      }
      debug(todayRecord)
      this.setData({
        type,
        isStatus,
        value,
        weight,
        defecation,
        showDelete,
        showWeight: isStatus,
        showDefecation: isStatus,
        recent: getCache(type.key)
      })
      await nextTick()
      await this.fetchScdData()
    },
    async fetchScdData () {
      try {
        const _isReview = await isReview()
        if (_isReview) {
          loading()
          const data = await getFoods()
          this.setData({
            loaded: true,
            scdFoods: data.map(v => v.name),
            isReview: _isReview
          })
        } else {
          this.setData({
            loaded: true
          })
        }
      } catch (e) {
        error(e)
        toast(TOAST_ERRORS.NETWORK_ERR)
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
      const { value, weight, defecation, showWeight, showDefecation } = this.data
      const hasValue = !!value
      const hasWeight = showWeight ? !!weight : false
      const hasDefecation = showDefecation ? !!defecation : false
      const hasContent = hasValue || hasWeight || hasDefecation

      if (!hasContent) {
        toast('写点东西吧')
        return
      }

      const weightInvalid = showWeight ? Number.isNaN(Number(weight)) : false
      if (weightInvalid) {
        toast('体重需输入数字')
        return
      }
      const defecationInvalid = showDefecation ? Number.isNaN(Number(defecation)) : false
      if (defecationInvalid) {
        toast('排便次数需输入数字')
        return
      }

      loading(true, '正在保存...')
      const db = wx.cloud.database()
      const toSave = this.data.type.key === DIARY_TYPES.STATUS.key ? {} : { [this.data.type.key]: this.data.value }

      if (showWeight) {
        toSave[DIARY_TYPES.WEIGHT.key] = weight === '' ? '' : Number(weight)
      }
      if (showDefecation) {
        toSave[DIARY_TYPES.DEFECATION.key] = defecation === '' ? '' : Number(defecation)
      }
      try {
        if (this.data.todayRecord) {
          const { stats: { updated } } = await db.collection('records').doc(this.data.todayRecord._id).update({
            data: toSave
          })
          // 当无变化时为0
          if (updated === 0 || updated === 1) {
            this.setTodayRecord({
              ...this.data.todayRecord,
              ...toSave
            })
            cacheInput(this.data.type.key, this.data.value)
            wx.navigateBack()
          } else {
            toast(TOAST_ERRORS.NETWORK_ERR)
          }
        } else {
          toSave.date = this.data.currentDateTs
          const { _id } = await db.collection('records').add({
            data: toSave
          })
          debug(_id)
          if (_id) {
            this.setTodayRecord({
              _id,
              ...toSave
            })
            cacheInput(this.data.type.key, this.data.value)
            wx.navigateBack()
          } else {
            toast(TOAST_ERRORS.NETWORK_ERR)
          }
        }
      } catch (e) {
        error(e)
        toast(TOAST_ERRORS.NETWORK_ERR)
      } finally {
        loading(false)
      }
    },
    deleteRecord () {
      if (!this.data.todayRecord) {
        return
      }
      wx.showModal({
        title: '确认',
        content: '记录删除后将无法恢复',
        confirmText: '删除',
        confirmColor: '#fa5151',
        cancelText: '取消',
        success: async ({ confirm }) => {
          if (confirm) {
            loading(true, '正在删除...')
            // 找出除了当前编辑模式的 key 以及其他默认忽略的 key
            // 进行剩余存在有效值的 key 计数
            const keys = this.data.type.keys ? this.data.type.keys : [this.data.type.key]
            const ignoreKeys = [].concat(['_id', '_openid', 'date'], keys)
            const allKeysOtherThanThis = Object.keys(this.data.todayRecord).filter(key => ignoreKeys.indexOf(key) < 0)
            let keysRemainOtherThanThis = allKeysOtherThanThis.length
            allKeysOtherThanThis.forEach(key => {
              const value = this.data.todayRecord[key]
              const isExistString = typeof value === 'string' && value.length > 0
              const isNumber = typeof value === 'number'
              const isExist = isExistString || isNumber
              debug(key, isExist, value)
              if (!isExist) {
                --keysRemainOtherThanThis
              }
            })
            debug(keysRemainOtherThanThis)
            const db = wx.cloud.database()
            try {
              if (keysRemainOtherThanThis > 0) {
                // 尚有其他 key 存在有效值，做更新操作
                const params = {}
                if (this.data.isStatus) {
                  params.weight = ''
                  params.defecation = ''
                } else {
                  params[this.data.type.key] = ''
                }
                const { stats: { updated } } = await db
                  .collection('records')
                  .doc(this.data.todayRecord._id)
                  .update({
                    data: params
                  })
                if (updated) {
                  this.setTodayRecord({
                    ...this.data.todayRecord,
                    ...params
                  })
                  wx.navigateBack()
                } else {
                  toast(TOAST_ERRORS.NETWORK_ERR)
                }
              } else {
                // 已无有效 key，直接删除
                const { stats: { removed } } = await db
                  .collection('records')
                  .doc(this.data.todayRecord._id)
                  .remove()
                if (removed) {
                  this.setTodayRecord(null)
                  wx.navigateBack()
                } else {
                  toast(TOAST_ERRORS.NETWORK_ERR)
                }
              }
            } catch (e) {
              error(e)
              toast(TOAST_ERRORS.NETWORK_ERR)
            } finally {
              loading(false)
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