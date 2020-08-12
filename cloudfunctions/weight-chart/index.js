const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database()
// 云函数入口函数
exports.main = async ({ limit = 100 }) => {
  try {
    const _ = db.command
    const before = new Date()
    before.setDate(before.getDate() - limit)
    // console.log(before100Days)
    const wxContext = cloud.getWXContext()
    return await db.collection('records')
      .field({
        _id: false,
        weight: true,
        date: true
      })
      .where({
        _openid: wxContext.OPENID,
        date: _.gte(before.getTime())
      })
      .orderBy('date', 'desc')
      .limit(limit)
      .get()
  } catch (e) {
    console.log(e)
    return e
  }
}
