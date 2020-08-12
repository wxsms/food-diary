import { storeBindingsBehavior } from 'mobx-miniprogram-bindings'
import themeMixin from '../../mixins/theme.mixin'
import shareMixin from '../../mixins/share.mixin'
import * as echarts from '../../libs/ec-canvas/echarts'
import { debug, error } from '../../utils/log.utils'
import { loading, toast, TOAST_ERRORS } from '../../utils/toast.utils'
import { format, startOfDay } from '../../utils/date.utils'
import find from 'lodash.find'
import { nextTick } from '../../utils/wx.utils'

Component({
  behaviors: [storeBindingsBehavior, themeMixin, shareMixin],
  data: {
    limit: 30,
    limitText: '近一个月',
    dataSet: [],
    ec: {
      lazyLoad: true
    },
    showActionSheet: false,
    options: [{
      text: '近一个月',
      limit: 30,
      value: 0
    }, {
      text: '近二个月',
      limit: 60,
      value: 1
    }, {
      text: '近三个月',
      limit: 90,
      value: 2
    }]
  },
  lifetimes: {
    attached () {
      if (typeof wx.onThemeChange === 'function') {
        this._initChart = () => {
          this.initChart()
        }
        wx.onThemeChange(this._initChart)
      }
    },
    detached () {
      if (typeof wx.offThemeChange === 'function') {
        wx.offThemeChange(this._initChart)
      }
    }
  },
  methods: {
    async onLoad () {
      this.ecComponent = this.selectComponent('#weight-chart')
      await this.fetchData()
    },
    showAction () {
      this.setData({ showActionSheet: true })
    },
    async onActionSelect ({ detail: { value } }) {
      const opt = this.data.options[value]
      this.setData({
        limit: opt.limit,
        limitText: opt.text,
        showActionSheet: false
      })
      await nextTick()
      await this.fetchData()
    },
    async fetchData () {
      try {
        loading()
        const { result: { data } } = await wx.cloud.callFunction({
          name: 'weight-chart',
          data: {
            limit: this.data.limit
          }
        })
        // debug(data)
        if (Array.isArray(data) && data.length > 0) {
          this.setData({ dataSet: data })
          this.initChart(data)
        }
      } catch (e) {
        error(e)
        toast(TOAST_ERRORS.NETWORK_ERR)
      } finally {
        loading(false)
      }
    },
    prepareData (data = this.data.dataSet) {
      const today = startOfDay(Date.now())
      const before = startOfDay(today.minus({ days: this.data.limit - 1 }))
      const records = []
      for (let ts = before.ts; ts <= today.ts; ts += 1000 * 60 * 60 * 24) {
        const record = find(data, v => v.date === ts)
        // debug(ts, record)
        records.push(Object.assign({ date: ts, weight: null }, record))
      }
      // debug(records)
      return records
    },
    dispose () {
      if (this.chart) {
        this.chart.dispose()
      }
    },
    initChart (_data = this.data.dataSet) {
      // debug(data)
      this.dispose()
      const data = this.prepareData(_data)
      this.ecComponent.init((canvas, width, height, dpr) => {
        const chart = echarts.init(canvas, null, {
          width: width,
          height: height,
          devicePixelRatio: dpr // new
        })
        const weights = data.map(v => v.weight)
        const weightsWithoutNull = weights.filter(v => typeof v === 'number')
        chart.setOption({
          color: [this.data.themeColors.chartLineColor],
          tooltip: {
            show: true,
            trigger: 'axis',
            formatter (data) {
              // debug(data)
              if (data[0] && typeof data[0].data === 'number') {
                return `${data[0].axisValue}：${data[0].data}kg`
              }
              return `${data[0].axisValue}：未记录`
            }
          },
          xAxis: {
            name: '日期',
            type: 'category',
            data: data.map(v => format(v.date)),
            axisLabel: {
              interval: 'auto',
              color: this.data.themeColors.chartTextColor
            },
            axisLine: {
              lineStyle: {
                color: this.data.themeColors.chartTextColor
              }
            },
            splitLine: {
              show: true,
              lineStyle: {
                color: this.data.themeColors.chartGridColor
              }
            }
          },
          yAxis: {
            type: 'value',
            name: '体重 (kg)',
            min: () => Math.floor(Math.min.apply(null, weightsWithoutNull)) - 1,
            max: () => Math.floor(Math.max.apply(null, weightsWithoutNull)) + 1,
            axisLabel: {
              color: this.data.themeColors.chartTextColor
            },
            axisLine: {
              lineStyle: {
                color: this.data.themeColors.chartTextColor
              }
            },
            splitLine: {
              show: true,
              lineStyle: {
                color: this.data.themeColors.chartGridColor
              }
            }
          },
          series: [{
            name: 'weight',
            type: 'line',
            symbol: 'circle',
            smooth: false,
            data: weights
          }]
        })
        this.chart = chart
        return chart
      })
    }
  }
})
