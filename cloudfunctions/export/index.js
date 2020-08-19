const cloud = require('wx-server-sdk')
const xlsx = require('node-xlsx')
const _ = require('lodash')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()
const cmd = db.command
const MAX_LIMIT = 100
// const dateOffset = 8 * 60 * 60 * 1000
// TZ=Asia/Shanghai 设置后为 +8 时区，无需偏移
const dateOffset = 0
const ERROR_CODES = {
  RATE: -10001
}

const TYPES = {
  DATE: { label: '日期', key: 'date' },
  BREAKFAST: { label: '早餐', key: 'breakfast' },
  LUNCH: { label: '午餐', key: 'lunch' },
  DINNER: { label: '晚餐', key: 'dinner' },
  SUPPLEMENT: { label: '补充', key: 'supplement' },
  OTHERS: { label: '其它', key: 'others' },
  ABNORMAL: { label: '异常', key: 'abnormal' },
  WEIGHT: { label: '体重 (kg)', key: 'weight' },
  DEFECATION: { label: '排便次数', key: 'defecation' }
}

// 云函数入口函数
exports.main = async ({ from, to, groupBy = 'month' }, context) => {
  try {
    const wxContext = cloud.getWXContext()
    // 检测是否允许调用
    const rateWhere = {
      _openid: wxContext.OPENID,
      module: 'export',
      type: 'daily'
    }
    const rateRes = await db
      .collection('rate-limit')
      .where(rateWhere)
      .get()
    if (rateRes.data && rateRes.data.length) {
      console.log('rate limit exceed.')
      return ERROR_CODES.RATE
    }
    // 查询条件
    const where = {
      _openid: wxContext.OPENID
    }
    // 设置了查询日期范围
    if (typeof from === 'number' && typeof to === 'number') {
      where.date = cmd.gte(from).and(cmd.lt(to))
    }
    // 获取总数
    const countResult = await db
      .collection('records')
      .where(where)
      .count()
    if (countResult.total === 0) {
      return ''
    }
    const total = countResult.total
    const batchTimes = Math.ceil(total / MAX_LIMIT)
    const tasks = []
    for (let i = 0; i < batchTimes; i++) {
      const promise = db
        .collection('records')
        .where(where)
        .orderBy('date', 'asc')
        .skip(i * MAX_LIMIT)
        .limit(MAX_LIMIT)
        .get()
      tasks.push(promise)
    }
    // 分批次获取所有范围内的数据
    const { data } = (await Promise.all(tasks)).reduce((acc, cur) => {
      return {
        data: acc.data.concat(cur.data),
        errMsg: acc.errMsg,
      }
    })
    // 生成 excel
    const keys = [
      TYPES.DATE,
      TYPES.BREAKFAST,
      TYPES.LUNCH,
      TYPES.DINNER,
      TYPES.SUPPLEMENT,
      TYPES.WEIGHT,
      TYPES.DEFECATION,
      TYPES.OTHERS,
      TYPES.ABNORMAL
    ]
    const groupedData = _.groupBy(data, v => {
      const date = new Date(v.date + dateOffset)
      if (groupBy === 'year') {
        return `${date.getFullYear()}`
      } else {
        return `${date.getFullYear()}-${date.getMonth() + 1}`
      }
    })
    // console.log(groupedData)
    const sheets = []
    Object.keys(groupedData).forEach(key => {
      const data = groupedData[key]
      const sheet = []
      sheet.push(keys.map(v => v.label))
      data.forEach(row => {
        const arr = []
        keys.map(v => v.key).forEach(v => {
          if (v === 'date') {
            const date = new Date(row[v] + dateOffset)
            arr.push(`${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`)
          } else {
            const isExist = typeof row[v] !== 'undefined' && row[v] !== null
            arr.push(isExist ? row[v] : '')
          }
        })
        sheet.push(arr)
      })
      sheets.push({
        name: key,
        data: sheet
      })
    })
    const buffer = await xlsx.build(sheets, {
      '!cols': [
        { wch: 10 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 10 },
        { wch: 10 },
        { wch: 20 },
        { wch: 20 }
      ]
    })
    // 上传至云储存
    const { fileID } = await cloud.uploadFile({
      cloudPath: `records-export-${wxContext.OPENID}.xlsx`,
      fileContent: buffer,
    })
    // 获取临时下载链接
    const res = await cloud.getTempFileURL({
      fileList: [fileID]
    })
    await db
      .collection('rate-limit')
      .add({
        data: {
          ts: Date.now(),
          ...rateWhere
        }
      })
    return res.fileList[0].tempFileURL
  } catch (e) {
    console.log(e)
    return e
  }
}
