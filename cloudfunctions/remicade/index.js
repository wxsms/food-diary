// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()
const MAX_LIMIT = 100

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const where = {
    _openid: wxContext.OPENID
  }
  // 获取总数
  const { total } = await db
    .collection('records-remicade')
    .where(where)
    .count()
  if (total === 0) {
    // 查询无记录
    return []
  }
  const batchTimes = Math.ceil(total / MAX_LIMIT)
  const tasks = []
  for (let i = 0; i < batchTimes; i++) {
    tasks.push(db
      .collection('records-remicade')
      .where(where)
      .orderBy('createTime', 'desc')
      .skip(i * MAX_LIMIT)
      .limit(MAX_LIMIT)
      .get())
  }
  // 分批次获取所有范围内的数据
  const recordsRes = await Promise.all(tasks)
  const { data } = recordsRes.reduce((acc, cur) => ({
    data: acc.data.concat(cur.data),
    errMsg: acc.errMsg
  }))
  return data || []
}
