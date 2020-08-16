const cloud = require('wx-server-sdk')
const xlsx = require('node-xlsx')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()

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
exports.main = async ({ from, to }, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const cmd = db.command
    const { data } = await db.collection('records')
      .where({
        _openid: wxContext.OPENID,
        date: cmd.gte(from).and(cmd.lt(to))
      })
      .orderBy('date', 'asc')
      .get()
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
    const sheet = []
    const dateOffset = 8 * 60 * 60 * 1000
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
    const date = new Date(from + dateOffset)
    const sheetName = `${date.getFullYear()}年${date.getMonth() + 1}月`
    const buffer = await xlsx.build([{
      name: sheetName,
      data: sheet
    }])
    const { fileID } = await cloud.uploadFile({
      cloudPath: `${wxContext.OPENID}-${sheetName}.xlsx`,
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
