const cloud = require('wx-server-sdk')
const xlsx = require('node-xlsx')
const _ = require('lodash')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()
const cmd = db.command
const MAX_LIMIT = 100

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
    const where = {
      _openid: wxContext.OPENID
    }
    if (typeof from === 'number' && typeof to === 'number') {
      where.date = cmd.gte(from).and(cmd.lt(to))
    }
    const countResult = await db
      .collection('records')
      .where(where)
      .count()
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
    const { data } = (await Promise.all(tasks)).reduce((acc, cur) => {
      return {
        data: acc.data.concat(cur.data),
        errMsg: acc.errMsg,
      }
    })
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
    const dateOffset = 8 * 60 * 60 * 1000
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
    const buffer = await xlsx.build(sheets)
    const { fileID } = await cloud.uploadFile({
      cloudPath: `records-export-${wxContext.OPENID}.xlsx`,
      fileContent: buffer,
    })
    const res = await cloud.getTempFileURL({
      fileList: [fileID]
    })
    return res.fileList[0].tempFileURL
  } catch (e) {
    console.log(e)
    return e
  }
}
